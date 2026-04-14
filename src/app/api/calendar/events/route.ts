/**
 * GET  /api/calendar/events       — List upcoming events (next 7 days, from DB cache)
 * POST /api/calendar/events       — Create a new event (on provider + cache)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptTextFromBase64, encryptTextToBase64 } from '@/lib/encryption/server'
import { createGoogleEvent, refreshGoogleToken } from '@/lib/calendar/google'
import { createOutlookEvent, refreshOutlookToken } from '@/lib/calendar/outlook'
import { syncCalendarEvents, detectConflicts } from '@/lib/calendar/sync'
import { analyzeScheduleConflict } from '@/lib/ai/schedule-assistant'
import type { CalendarConnection, NewCalendarEvent } from '@/lib/calendar/types'
import type { GoogleEventRaw, OutlookEventRaw } from '@/lib/calendar/types'

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const forceSync = searchParams.get('sync') === 'true'

    // Optionally trigger a fresh sync
    if (forceSync) {
      await syncCalendarEvents(user.id).catch((err) =>
        console.warn('Background sync warning:', err),
      )
    }

    const now = new Date()
    const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_at', now.toISOString())
      .lte('start_at', timeMax.toISOString())
      .order('start_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch calendar events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ events: events ?? [] })
  } catch (err) {
    console.error('GET /api/calendar/events error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      provider?: unknown
      title?: unknown
      description?: unknown
      startAt?: unknown
      endAt?: unknown
      location?: unknown
      isAllDay?: unknown
      skipConflictCheck?: unknown
    }

    // Validate required fields
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (typeof body.startAt !== 'string' || !body.startAt) {
      return NextResponse.json({ error: 'startAt is required (ISO 8601)' }, { status: 400 })
    }
    if (typeof body.endAt !== 'string' || !body.endAt) {
      return NextResponse.json({ error: 'endAt is required (ISO 8601)' }, { status: 400 })
    }

    const provider = typeof body.provider === 'string' ? body.provider : null
    const newEvent: NewCalendarEvent = {
      title: body.title.trim(),
      description: typeof body.description === 'string' ? body.description : undefined,
      startAt: body.startAt,
      endAt: body.endAt,
      location: typeof body.location === 'string' ? body.location : undefined,
      isAllDay: body.isAllDay === true,
    }

    // ── Conflict detection (unless explicitly skipped) ──
    if (body.skipConflictCheck !== true) {
      const conflict = await detectConflicts(user.id, newEvent.startAt, newEvent.endAt)
      if (conflict.hasConflict) {
        const analysis = await analyzeScheduleConflict(
          conflict.conflictingEvents,
          newEvent,
        ).catch(() => null)

        return NextResponse.json(
          {
            error: 'Schedule conflict detected',
            conflict: {
              hasConflict: true,
              conflictingEvents: conflict.conflictingEvents,
              analysis,
            },
          },
          { status: 409 },
        )
      }
    }

    // ── Find the active connection for the requested provider ──
    let connQuery = supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (provider === 'google' || provider === 'outlook') {
      connQuery = connQuery.eq('provider', provider)
    }

    const { data: connections, error: connErr } = await connQuery.limit(1)

    if (connErr || !connections?.length) {
      return NextResponse.json(
        { error: 'No active calendar connection found. Please connect a calendar first.' },
        { status: 422 },
      )
    }

    const conn = connections[0] as CalendarConnection

    // ── Get a valid access token (refresh if expired) ──
    let accessToken = decryptTextFromBase64(conn.accessToken)
    const isExpired =
      conn.tokenExpiresAt
        ? new Date(conn.tokenExpiresAt) <= new Date(Date.now() + 60_000)
        : false

    if (isExpired && conn.refreshToken) {
      const refreshToken = decryptTextFromBase64(conn.refreshToken)
      const refreshed =
        conn.provider === 'google'
          ? await refreshGoogleToken(refreshToken)
          : await refreshOutlookToken(refreshToken)

      accessToken = refreshed.accessToken
      await supabase
        .from('calendar_connections')
        .update({
          access_token: encryptTextToBase64(refreshed.accessToken),
          token_expires_at: refreshed.expiresAt.toISOString(),
        })
        .eq('id', conn.id)
    }

    // ── Create event on provider ──
    let externalId: string
    let rawData: Record<string, unknown>

    if (conn.provider === 'google') {
      const created = await createGoogleEvent(accessToken, conn.calendarId ?? 'primary', newEvent) as GoogleEventRaw
      externalId = created.id
      rawData = created as unknown as Record<string, unknown>
    } else {
      const created = await createOutlookEvent(accessToken, newEvent) as OutlookEventRaw
      externalId = created.id
      rawData = created as unknown as Record<string, unknown>
    }

    // ── Persist to local cache ──
    const { data: cached, error: insertErr } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        connection_id: conn.id,
        external_id: externalId,
        title: newEvent.title,
        description: newEvent.description ?? null,
        start_at: newEvent.startAt,
        end_at: newEvent.endAt,
        location: newEvent.location ?? null,
        is_all_day: newEvent.isAllDay ?? false,
        status: 'confirmed',
        source_provider: conn.provider,
        raw_data: rawData,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Failed to cache created event:', insertErr)
      // Not a fatal error — event was created on provider side
    }

    return NextResponse.json({ event: cached }, { status: 201 })
  } catch (err) {
    console.error('POST /api/calendar/events error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
