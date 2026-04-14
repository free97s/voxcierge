/**
 * Calendar sync utilities.
 *
 * syncCalendarEvents  — pull events from all connected providers into the local DB cache
 * detectConflicts     — check whether a proposed time slot conflicts with existing events
 * suggestAlternativeTimes — find open time slots around a preferred date
 */

import { createClient } from '@/lib/supabase/server'
import { encryptTextToBase64, decryptTextFromBase64 } from '@/lib/encryption/server'
import { fetchGoogleEvents, refreshGoogleToken } from './google'
import { fetchOutlookEvents, refreshOutlookToken } from './outlook'
import type {
  CalendarConnection,
  CalendarEvent,
  ConflictResult,
  GoogleEventRaw,
  OutlookEventRaw,
  TimeSlot,
} from './types'

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Decrypt and, if expired, refresh the stored access token. */
async function getValidAccessToken(
  connection: CalendarConnection,
): Promise<{ accessToken: string; needsUpdate: boolean; newToken?: string; newExpiry?: string }> {
  const accessToken = decryptTextFromBase64(connection.accessToken)

  const isExpired =
    connection.tokenExpiresAt
      ? new Date(connection.tokenExpiresAt) <= new Date(Date.now() + 60_000)
      : false

  if (!isExpired) {
    return { accessToken, needsUpdate: false }
  }

  if (!connection.refreshToken) {
    throw new Error(`No refresh token available for connection ${connection.id}`)
  }

  const refreshToken = decryptTextFromBase64(connection.refreshToken)

  if (connection.provider === 'google') {
    const { accessToken: newRaw, expiresAt } = await refreshGoogleToken(refreshToken)
    return {
      accessToken: newRaw,
      needsUpdate: true,
      newToken: encryptTextToBase64(newRaw),
      newExpiry: expiresAt.toISOString(),
    }
  } else {
    const { accessToken: newRaw, expiresAt } = await refreshOutlookToken(refreshToken)
    return {
      accessToken: newRaw,
      needsUpdate: true,
      newToken: encryptTextToBase64(newRaw),
      newExpiry: expiresAt.toISOString(),
    }
  }
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normaliseGoogleEvent(
  raw: GoogleEventRaw,
  userId: string,
  connectionId: string,
): Omit<CalendarEvent, 'id' | 'createdAt' | 'syncedAt'> {
  const isAllDay = Boolean(raw.start.date && !raw.start.dateTime)
  return {
    userId,
    connectionId,
    externalId: raw.id,
    title: raw.summary ?? '(제목 없음)',
    description: raw.description ?? null,
    startAt: raw.start.dateTime ?? raw.start.date ?? '',
    endAt: raw.end.dateTime ?? raw.end.date ?? '',
    location: raw.location ?? null,
    isAllDay,
    status: raw.status ?? 'confirmed',
    sourceProvider: 'google',
    rawData: raw as unknown as Record<string, unknown>,
  }
}

function normaliseOutlookEvent(
  raw: OutlookEventRaw,
  userId: string,
  connectionId: string,
): Omit<CalendarEvent, 'id' | 'createdAt' | 'syncedAt'> {
  return {
    userId,
    connectionId,
    externalId: raw.id,
    title: raw.subject ?? '(제목 없음)',
    description: raw.body?.content ?? null,
    startAt: raw.start.dateTime
      ? new Date(raw.start.dateTime).toISOString()
      : '',
    endAt: raw.end.dateTime
      ? new Date(raw.end.dateTime).toISOString()
      : '',
    location: raw.location?.displayName ?? null,
    isAllDay: raw.isAllDay ?? false,
    status: raw.showAs ?? 'confirmed',
    sourceProvider: 'outlook',
    rawData: raw as unknown as Record<string, unknown>,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sync all events from every active calendar connection for the given user.
 * Pulls the next 7 days and upserts into `calendar_events`.
 */
export async function syncCalendarEvents(userId: string): Promise<{ synced: number; errors: string[] }> {
  const supabase = await createClient()
  const errors: string[] = []
  let synced = 0

  const { data: connections, error: connErr } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (connErr || !connections?.length) {
    return { synced: 0, errors: connErr ? [connErr.message] : [] }
  }

  const now = new Date()
  const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  for (const conn of connections as CalendarConnection[]) {
    try {
      const { accessToken, needsUpdate, newToken, newExpiry } = await getValidAccessToken(conn)

      // Persist refreshed token if it was updated
      if (needsUpdate && newToken) {
        await supabase
          .from('calendar_connections')
          .update({ access_token: newToken, token_expires_at: newExpiry })
          .eq('id', conn.id)
      }

      let normalised: Omit<CalendarEvent, 'id' | 'createdAt' | 'syncedAt'>[] = []

      if (conn.provider === 'google') {
        const raw = await fetchGoogleEvents(
          accessToken,
          conn.calendarId ?? 'primary',
          now,
          timeMax,
        )
        normalised = raw.map((e) => normaliseGoogleEvent(e, userId, conn.id))
      } else {
        const raw = await fetchOutlookEvents(accessToken, now, timeMax)
        normalised = raw.map((e) => normaliseOutlookEvent(e, userId, conn.id))
      }

      if (normalised.length === 0) continue

      // Upsert into calendar_events — conflict on (connection_id, external_id)
      const rows = normalised.map((e) => ({
        user_id: e.userId,
        connection_id: e.connectionId,
        external_id: e.externalId,
        title: e.title,
        description: e.description,
        start_at: e.startAt,
        end_at: e.endAt,
        location: e.location,
        is_all_day: e.isAllDay,
        status: e.status,
        source_provider: e.sourceProvider,
        raw_data: e.rawData,
        synced_at: new Date().toISOString(),
      }))

      const { error: upsertErr } = await supabase
        .from('calendar_events')
        .upsert(rows, { onConflict: 'connection_id,external_id' })

      if (upsertErr) {
        errors.push(`${conn.provider}: ${upsertErr.message}`)
      } else {
        synced += normalised.length
      }
    } catch (err) {
      errors.push(`${conn.provider}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { synced, errors }
}

/**
 * Detect calendar conflicts for a proposed time range.
 * Returns any cached events that overlap with [startAt, endAt].
 */
export async function detectConflicts(
  userId: string,
  startAt: string,
  endAt: string,
): Promise<ConflictResult> {
  const supabase = await createClient()

  // Overlapping condition: existing.start_at < proposed.end AND existing.end_at > proposed.start
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .lt('start_at', endAt)
    .gt('end_at', startAt)

  if (error) {
    throw new Error(`Conflict detection query failed: ${error.message}`)
  }

  const conflictingEvents = (data ?? []) as unknown as CalendarEvent[]

  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
  }
}

/**
 * Suggest alternative free time slots on or around preferredDate.
 * Looks at cached events and finds gaps of at least durationMinutes.
 * Returns up to 3 alternatives.
 */
export async function suggestAlternativeTimes(
  userId: string,
  durationMinutes: number,
  preferredDate: Date,
): Promise<TimeSlot[]> {
  const supabase = await createClient()

  // Search window: preferred day ± 2 days
  const searchStart = new Date(preferredDate)
  searchStart.setHours(8, 0, 0, 0)
  const searchEnd = new Date(preferredDate)
  searchEnd.setDate(searchEnd.getDate() + 2)
  searchEnd.setHours(22, 0, 0, 0)

  const { data } = await supabase
    .from('calendar_events')
    .select('start_at, end_at')
    .eq('user_id', userId)
    .gte('start_at', searchStart.toISOString())
    .lte('end_at', searchEnd.toISOString())
    .order('start_at', { ascending: true })

  // Build busy intervals
  const busy: Array<{ start: Date; end: Date }> = (data ?? []).map((e: { start_at: string; end_at: string }) => ({
    start: new Date(e.start_at),
    end: new Date(e.end_at),
  }))

  const slots: TimeSlot[] = []
  const duration = durationMinutes * 60 * 1000

  // Walk through the day in 30-minute increments looking for gaps
  let cursor = new Date(searchStart)
  const workDayEnd = new Date(searchStart)
  workDayEnd.setHours(20, 0, 0, 0)

  while (cursor < searchEnd && slots.length < 3) {
    const slotEnd = new Date(cursor.getTime() + duration)

    // Only consider slots within working hours (08:00 – 20:00)
    const cursorHour = cursor.getHours()
    if (cursorHour >= 20) {
      // Jump to next day 08:00
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(8, 0, 0, 0)
      continue
    }

    const overlaps = busy.some(
      (b) => b.start < slotEnd && b.end > cursor,
    )

    if (!overlaps) {
      const label = formatKoreanSlot(cursor, slotEnd)
      slots.push({
        startAt: cursor.toISOString(),
        endAt: slotEnd.toISOString(),
        label,
        reason: '해당 시간대에 일정이 없습니다.',
      })
      // Next candidate starts after this slot
      cursor = new Date(slotEnd)
    } else {
      // Move forward 30 minutes
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
    }
  }

  return slots
}

function formatKoreanSlot(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateFmt = start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  return `${dateFmt} ${fmt(start)} ~ ${fmt(end)}`
}
