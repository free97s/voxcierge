import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/diary/export?format=json|markdown
// 전체 일기를 백업용으로 내보내기
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const format = request.nextUrl.searchParams.get('format') ?? 'markdown'

    const { data, error } = await supabase
      .from('daily_diaries')
      .select('*')
      .eq('user_id', user.id)
      .order('diary_date', { ascending: true })

    if (error) {
      console.error('[GET /api/diary/export] error:', error)
      return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }

    const diaries = data ?? []

    if (format === 'json') {
      const jsonContent = JSON.stringify(
        diaries.map((d: Record<string, unknown>) => ({
          date: d.diary_date,
          content: d.content,
          mood: d.mood,
          highlights: d.highlights,
          stats: d.stats,
        })),
        null,
        2,
      )

      return new NextResponse(jsonContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="voxcierge-diary-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    // Markdown format
    const moodEmoji: Record<string, string> = {
      great: '🌟',
      good: '😊',
      neutral: '😐',
      tired: '😴',
      tough: '💪',
    }

    const mdLines = [
      '# VoxCierge 소설 일기장',
      '',
      `> 내보내기 날짜: ${new Date().toLocaleDateString('ko-KR')}`,
      `> 총 ${diaries.length}편의 이야기`,
      '',
      '---',
      '',
    ]

    for (const d of diaries) {
      const row = d as Record<string, unknown>
      const mood = moodEmoji[(row.mood as string) ?? 'neutral'] ?? '📖'
      mdLines.push(`## ${row.diary_date as string} ${mood}`)
      mdLines.push('')
      mdLines.push(row.content as string)
      mdLines.push('')

      const stats = row.stats as Record<string, number> | null
      if (stats) {
        mdLines.push(`> 완료 ${stats.completed ?? 0} | 추가 ${stats.added ?? 0} | 연기 ${stats.postponed ?? 0} | 음성 ${stats.voiceSessions ?? 0}`)
      }

      mdLines.push('')
      mdLines.push('---')
      mdLines.push('')
    }

    const mdContent = mdLines.join('\n')

    return new NextResponse(mdContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="voxcierge-diary-${new Date().toISOString().slice(0, 10)}.md"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/diary/export] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
