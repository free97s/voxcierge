/**
 * POST /api/calendar/conflicts
 *
 * Body: { startAt: string (ISO 8601), endAt: string (ISO 8601), durationMinutes?: number }
 *
 * Returns:
 *   - hasConflict: boolean
 *   - conflictingEvents: CalendarEvent[]
 *   - analysis: AI conflict explanation
 *   - alternatives: AI-suggested free time slots
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectConflicts, suggestAlternativeTimes } from '@/lib/calendar/sync'
import {
  analyzeScheduleConflict,
  suggestReschedule,
} from '@/lib/ai/schedule-assistant'
import type { NewCalendarEvent } from '@/lib/calendar/types'

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
      startAt?: unknown
      endAt?: unknown
      title?: unknown
      durationMinutes?: unknown
      userPreferences?: unknown
    }

    if (typeof body.startAt !== 'string' || !body.startAt) {
      return NextResponse.json({ error: 'startAt is required (ISO 8601)' }, { status: 400 })
    }
    if (typeof body.endAt !== 'string' || !body.endAt) {
      return NextResponse.json({ error: 'endAt is required (ISO 8601)' }, { status: 400 })
    }

    const startAt = body.startAt
    const endAt = body.endAt
    const title = typeof body.title === 'string' ? body.title : '새 일정'
    const durationMinutes =
      typeof body.durationMinutes === 'number' && body.durationMinutes > 0
        ? body.durationMinutes
        : Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000)
    const userPreferences =
      typeof body.userPreferences === 'string' ? body.userPreferences : undefined

    // 1. Detect conflicts from local cache
    const conflict = await detectConflicts(user.id, startAt, endAt)

    if (!conflict.hasConflict) {
      return NextResponse.json({
        hasConflict: false,
        conflictingEvents: [],
        analysis: {
          severity: 'none',
          explanation: '선택한 시간대에 충돌하는 일정이 없습니다.',
          canProceed: true,
          conflictDetails: [],
        },
        alternatives: [],
      })
    }

    // 2. AI conflict analysis
    const mockNewEvent: NewCalendarEvent = { title, startAt, endAt }
    const [analysis, freeSlots] = await Promise.all([
      analyzeScheduleConflict(conflict.conflictingEvents, mockNewEvent).catch(() => null),
      suggestAlternativeTimes(user.id, durationMinutes, new Date(startAt)).catch(() => []),
    ])

    // 3. AI reschedule suggestion
    const reschedule = await suggestReschedule(
      conflict.conflictingEvents,
      freeSlots,
      userPreferences,
    ).catch(() => null)

    return NextResponse.json({
      hasConflict: true,
      conflictingEvents: conflict.conflictingEvents,
      analysis,
      alternatives: reschedule?.alternatives ?? freeSlots,
      recommendedSlot: reschedule?.recommendedSlot ?? null,
      message: reschedule?.message ?? null,
    })
  } catch (err) {
    console.error('POST /api/calendar/conflicts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
