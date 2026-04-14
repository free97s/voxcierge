import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyDiary } from '@/lib/ai/diary'
import type { DailyDiary } from '@/types/diary'

export const dynamic = 'force-dynamic'

function rowToDiary(row: Record<string, unknown>): DailyDiary {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    diaryDate: row.diary_date as string,
    content: row.content as string,
    mood: (row.mood ?? null) as DailyDiary['mood'],
    highlights: (row.highlights ?? []) as string[],
    stats: (row.stats ?? { completed: 0, added: 0, postponed: 0, voiceSessions: 0 }) as DailyDiary['stats'],
    audioUrl: (row.audio_url ?? null) as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// GET /api/diary?date=2026-04-15  → single diary
// GET /api/diary?limit=7           → recent N diaries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const limitParam = searchParams.get('limit')

    if (date) {
      const { data, error } = await supabase
        .from('daily_diaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('diary_date', date)
        .maybeSingle()

      if (error) {
        console.error('[GET /api/diary] fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch diary' }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ diary: null }, { status: 404 })
      }
      return NextResponse.json({ diary: rowToDiary(data as Record<string, unknown>) })
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 7
    const { data, error } = await supabase
      .from('daily_diaries')
      .select('*')
      .eq('user_id', user.id)
      .order('diary_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[GET /api/diary] list error:', error)
      return NextResponse.json({ error: 'Failed to fetch diaries' }, { status: 500 })
    }

    return NextResponse.json({
      diaries: (data ?? []).map((row) => rowToDiary(row as Record<string, unknown>)),
    })
  } catch (err) {
    console.error('[GET /api/diary] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/diary?cleanup=true → 30일 이전 일기 자동 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    const cutoff = cutoffDate.toISOString().slice(0, 10)

    const { error, count } = await supabase
      .from('daily_diaries')
      .delete()
      .eq('user_id', user.id)
      .lt('diary_date', cutoff)

    if (error) {
      console.error('[DELETE /api/diary] cleanup error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    return NextResponse.json({ deleted: count ?? 0, cutoffDate: cutoff })
  } catch (err) {
    console.error('[DELETE /api/diary] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/diary { date: '2026-04-15' } → generate or regenerate diary
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { date?: string }
    const date = body.date ?? new Date().toISOString().slice(0, 10)

    // Generate diary content via AI
    const { content, mood, highlights, stats } = await generateDailyDiary(
      user.id,
      date,
      supabase,
    )

    // Upsert — update if already exists
    const { data, error } = await supabase
      .from('daily_diaries')
      .upsert(
        {
          user_id: user.id,
          diary_date: date,
          content,
          mood,
          highlights,
          stats,
          audio_url: null,
        },
        { onConflict: 'user_id,diary_date' },
      )
      .select()
      .single()

    if (error || !data) {
      console.error('[POST /api/diary] upsert error:', error)
      return NextResponse.json({ error: 'Failed to save diary' }, { status: 500 })
    }

    return NextResponse.json(
      { diary: rowToDiary(data as Record<string, unknown>) },
      { status: 201 },
    )
  } catch (err) {
    console.error('[POST /api/diary] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
