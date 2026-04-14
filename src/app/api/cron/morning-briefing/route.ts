import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { generateBriefingSummary } from '@/lib/ai/summarization'
import { sendPushNotification } from '@/lib/notifications/push'
import { shouldSendBriefing } from '@/lib/notifications/scheduler'
import type { WebPushSubscription } from '@/lib/notifications/push'

// Service-role client bypasses RLS — only for server-side cron jobs
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Fetch all users with morning briefing enabled
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, full_name, timezone, briefing_time_morning, push_subscriptions')
    .eq('briefing_enabled', true)
    .eq('briefing_morning', true)

  if (profilesError) {
    console.error('[cron/morning-briefing] Failed to fetch profiles:', profilesError)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users' })
  }

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const profile of profiles) {
    try {
      const timezone = profile.timezone ?? 'Asia/Seoul'
      const briefingTime = profile.briefing_time_morning ?? '07:00'

      if (!shouldSendBriefing(timezone, briefingTime, 'morning')) {
        results.skipped++
        continue
      }

      const userName =
        profile.display_name ?? profile.full_name ?? '사용자'

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
          type: 'morning',
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
        console.error(`[cron/morning-briefing] Insert failed for ${profile.id}:`, insertError)
        results.errors++
        continue
      }

      // Send push notification if subscription exists
      const subscriptions = (profile.push_subscriptions ?? []) as WebPushSubscription[]
      if (subscriptions.length > 0) {
        const firstLine = content.split('\n').find((l: string) => l.trim()) ?? '오늘의 브리핑이 준비됐습니다'
        for (const sub of subscriptions) {
          await sendPushNotification(sub, {
            title: `${userName}님의 아침 브리핑`,
            body: firstLine.replace(/^#+\s*/, '').slice(0, 100),
            url: '/home',
            tag: 'morning-briefing',
          })
        }
      }

      results.sent++
    } catch (err) {
      console.error(`[cron/morning-briefing] Error for user ${profile.id}:`, err)
      results.errors++
    }
  }

  console.info('[cron/morning-briefing] Done:', results)
  return NextResponse.json({ ...results, timestamp: now.toISOString() })
}
