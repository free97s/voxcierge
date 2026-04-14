import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { shouldSendCheckin, buildCheckinMessage } from '@/lib/notifications/scheduler'
import { sendPushNotification } from '@/lib/notifications/push'
import type { Task, CheckinEvent } from '@/types/task'
import type { WebPushSubscription } from '@/lib/notifications/push'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient(url, serviceKey, { auth: { persistSession: false } })
}

interface DbTask {
  id: string
  user_id: string
  title: string
  description?: string | null
  status: Task['status']
  priority: Task['priority']
  due_at?: string | null
  completed_at?: string | null
  postponed_until?: string | null
  person?: string | null
  place?: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

interface DbCheckinEvent {
  id: string
  task_id: string
  user_id: string
  sent_at: string
  responded_at?: string | null
  response_action?: string | null
  postponed_until?: string | null
  channel: string
}

interface DbProfile {
  id: string
  full_name?: string | null
  push_subscription?: WebPushSubscription | null
}

function dbTaskToTask(row: DbTask): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    postponedUntil: row.postponed_until ?? undefined,
    person: row.person ?? undefined,
    place: row.place ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function dbCheckinToCheckin(row: DbCheckinEvent): CheckinEvent {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    sentAt: row.sent_at,
    respondedAt: row.responded_at ?? undefined,
    responseAction: row.response_action as CheckinEvent['responseAction'] ?? undefined,
    postponedUntil: row.postponed_until ?? undefined,
    channel: row.channel,
  }
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Fetch overdue tasks (pending/in_progress, due_at < now)
  const { data: rawTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .lt('due_at', now.toISOString())
    .not('due_at', 'is', null)

  if (tasksError) {
    console.error('[cron/task-checkin] Failed to fetch tasks:', tasksError)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }

  if (!rawTasks || rawTasks.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No overdue tasks' })
  }

  const tasks = (rawTasks as DbTask[]).map(dbTaskToTask)
  const taskIds = tasks.map((t) => t.id)
  const userIds = [...new Set(tasks.map((t) => t.userId))]

  // Fetch all recent check-in events for these tasks (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rawCheckins } = await supabase
    .from('checkin_events')
    .select('*')
    .in('task_id', taskIds)
    .gte('sent_at', sevenDaysAgo)

  const checkins = ((rawCheckins ?? []) as DbCheckinEvent[]).map(dbCheckinToCheckin)

  // Fetch push subscriptions for relevant users
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, push_subscription')
    .in('id', userIds)

  const profileMap = new Map<string, DbProfile>(
    ((rawProfiles ?? []) as DbProfile[]).map((p) => [p.id, p]),
  )

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const task of tasks) {
    try {
      const taskCheckins = checkins.filter((c) => c.taskId === task.id)

      if (!shouldSendCheckin(task, taskCheckins)) {
        results.skipped++
        continue
      }

      const message = buildCheckinMessage(task.title)

      // Insert checkin_event record
      const { data: checkinEvent, error: insertError } = await supabase
        .from('checkin_events')
        .insert({
          task_id: task.id,
          user_id: task.userId,
          sent_at: now.toISOString(),
          channel: 'push',
        })
        .select()
        .single()

      if (insertError || !checkinEvent) {
        console.error(`[cron/task-checkin] Insert failed for task ${task.id}:`, insertError)
        results.errors++
        continue
      }

      // Insert task_history entry
      await supabase.from('task_history').insert({
        task_id: task.id,
        user_id: task.userId,
        action: 'checkin_sent',
        previous_status: task.status,
        new_status: task.status,
        metadata: { checkin_event_id: checkinEvent.id, channel: 'push' },
      })

      // Send push notification
      const profile = profileMap.get(task.userId)
      const subscription = (profile?.push_subscription ?? null) as WebPushSubscription | null

      if (subscription) {
        await sendPushNotification(subscription, {
          title: '할일 체크인',
          body: message,
          url: `/tasks/${task.id}`,
          tag: `checkin-${task.id}`,
        })
      }

      results.sent++
    } catch (err) {
      console.error(`[cron/task-checkin] Error for task ${task.id}:`, err)
      results.errors++
    }
  }

  console.info('[cron/task-checkin] Done:', results)
  return NextResponse.json({ ...results, timestamp: now.toISOString() })
}
