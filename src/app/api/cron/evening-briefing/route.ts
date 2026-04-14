import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { generateBriefingSummary } from '@/lib/ai/summarization'
import { sendPushNotification } from '@/lib/notifications/push'
import { shouldSendBriefing } from '@/lib/notifications/scheduler'
import type { WebPushSubscription } from '@/lib/notifications/push'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, timezone, briefing_time_evening, push_subscription')
    .eq('briefing_enabled', true)

  if (profilesError) {
    console.error('[cron/evening-briefing] Failed to fetch profiles:', profilesError)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users' })
  }

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const profile of profiles) {
    try {
      const timezone = profile.timezone ?? 'Asia/Seoul'
      const briefingTime = profile.briefing_time_evening ?? '20:00'

      if (!shouldSendBriefing(timezone, briefingTime, 'evening')) {
        results.skipped++
        continue
      }

      const userName = profile.full_name ?? '사용자'

      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)

      const [pendingResult, completedResult, overdueResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, due_at, priority')
          .eq('user_id', profile.id)
          .in('status', ['pending', 'in_progress'])
          .gte('due_at', todayStart.toISOString())
          .lte('due_at', todayEnd.toISOString()),

        supabase
          .from('tasks')
          .select('id, title, due_at, priority')
          .eq('user_id', profile.id)
          .eq('status', 'completed')
          .gte('completed_at', todayStart.toISOString()),

        supabase
          .from('tasks')
          .select('id, title, due_at, priority')
          .eq('user_id', profile.id)
          .in('status', ['pending', 'in_progress'])
          .lt('due_at', now.toISOString()),
      ])

      const pendingTasks = pendingResult.data ?? []
      const completedTasks = completedResult.data ?? []
      const overdueTasks = overdueResult.data ?? []

      const content = await generateBriefingSummary(
        pendingTasks,
        completedTasks,
        overdueTasks,
        userName,
      )

      const { data: briefing, error: insertError } = await supabase
        .from('briefings')
        .insert({
          user_id: profile.id,
          type: 'evening',
          content,
          tasks_summary: {
            pending: pendingTasks.length,
            completed: completedTasks.length,
            overdue: overdueTasks.length,
          },
          generated_at: now.toISOString(),
          delivered_at: now.toISOString(),
        })
        .select()
        .single()

      if (insertError || !briefing) {
        console.error(`[cron/evening-briefing] Insert failed for ${profile.id}:`, insertError)
        results.errors++
        continue
      }

      const subscription = profile.push_subscription as WebPushSubscription | null
      if (subscription) {
        const firstLine = content.split('\n').find((l: string) => l.trim()) ?? '오늘의 저녁 브리핑이 준비됐습니다'
        await sendPushNotification(subscription, {
          title: `${userName}님의 저녁 브리핑`,
          body: firstLine.replace(/^#+\s*/, '').slice(0, 100),
          url: '/home',
          tag: 'evening-briefing',
        })
      }

      results.sent++
    } catch (err) {
      console.error(`[cron/evening-briefing] Error for user ${profile.id}:`, err)
      results.errors++
    }
  }

  console.info('[cron/evening-briefing] Done:', results)
  return NextResponse.json({ ...results, timestamp: now.toISOString() })
}
