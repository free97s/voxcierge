/**
 * POST /api/calendar/sync
 *
 * Manually trigger a full calendar sync for the authenticated user.
 * Pulls events from all active connections and updates the local DB cache.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCalendarEvents } from '@/lib/calendar/sync'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncCalendarEvents(user.id)

    if (result.errors.length > 0 && result.synced === 0) {
      // All providers failed
      return NextResponse.json(
        { error: 'Sync failed for all providers', details: result.errors },
        { status: 502 },
      )
    }

    return NextResponse.json({
      synced: result.synced,
      errors: result.errors.length > 0 ? result.errors : undefined,
      syncedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('POST /api/calendar/sync error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
