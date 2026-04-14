/**
 * GET    /api/calendar/connections   — List connected calendars
 * DELETE /api/calendar/connections   — Disconnect a calendar
 *
 * DELETE body: { id: string }  (connection UUID)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('id, provider, email, calendar_id, is_active, token_expires_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch calendar connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Never expose tokens — only metadata
    return NextResponse.json({ connections: connections ?? [] })
  } catch (err) {
    console.error('GET /api/calendar/connections error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { id?: unknown }
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'Connection id is required' }, { status: 400 })
    }

    // Verify ownership via RLS + explicit where clause
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', body.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete calendar connection:', error)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/calendar/connections error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
