import type { Task, CheckinEvent } from '@/types/task'

const MAX_CHECKINS_PER_TASK = 3
const CHECKIN_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Determine whether a briefing should be sent now for a user in the given
 * timezone, based on their configured briefing time.
 *
 * @param userTimezone  IANA timezone string e.g. "Asia/Seoul"
 * @param briefingTime  HH:MM 24-hour string e.g. "07:00"
 * @param type          'morning' | 'evening'
 * @param windowMinutes How many minutes around the target time to consider "now" (default 5)
 */
export function shouldSendBriefing(
  userTimezone: string,
  briefingTime: string,
  type: 'morning' | 'evening',
  windowMinutes = 5,
): boolean {
  void type // type may be used for future logic differentiation

  let nowInZone: Date
  try {
    // Build a Date representing "now" in the user's timezone
    const nowString = new Date().toLocaleString('en-US', { timeZone: userTimezone })
    nowInZone = new Date(nowString)
  } catch {
    console.warn(`[scheduler] Invalid timezone "${userTimezone}", skipping`)
    return false
  }

  const [targetHour, targetMinute] = briefingTime.split(':').map(Number)
  if (isNaN(targetHour) || isNaN(targetMinute)) {
    console.warn(`[scheduler] Invalid briefingTime "${briefingTime}", skipping`)
    return false
  }

  const currentMinutes = nowInZone.getHours() * 60 + nowInZone.getMinutes()
  const targetMinutes = targetHour * 60 + targetMinute

  return Math.abs(currentMinutes - targetMinutes) <= windowMinutes
}

/**
 * Return tasks that are overdue: status pending/in_progress with a due_at in
 * the past.
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date()
  return tasks.filter((task) => {
    if (task.status !== 'pending' && task.status !== 'in_progress') return false
    if (!task.dueAt) return false
    return new Date(task.dueAt) < now
  })
}

/**
 * Decide whether a proactive check-in should be sent for a task.
 *
 * Rules:
 * - Task must be overdue (handled upstream, but we guard anyway)
 * - Total check-ins for this task must be < MAX_CHECKINS_PER_TASK
 * - The most recent check-in must be older than CHECKIN_COOLDOWN_MS
 */
export function shouldSendCheckin(
  task: Task,
  recentCheckins: CheckinEvent[],
): boolean {
  if (task.status !== 'pending' && task.status !== 'in_progress') return false
  if (!task.dueAt || new Date(task.dueAt) >= new Date()) return false

  const taskCheckins = recentCheckins.filter((c) => c.taskId === task.id)

  if (taskCheckins.length >= MAX_CHECKINS_PER_TASK) return false

  if (taskCheckins.length === 0) return true

  const latestCheckin = taskCheckins.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  )[0]

  const elapsed = Date.now() - new Date(latestCheckin.sentAt).getTime()
  return elapsed >= CHECKIN_COOLDOWN_MS
}

/**
 * Build a Korean check-in message for a task.
 */
export function buildCheckinMessage(taskTitle: string): string {
  return `어제 말씀하신 '${taskTitle}'은(는) 마무리되었나요?`
}
