'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Download, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DiaryCard, MOOD_EMOJI } from '@/components/diary/DiaryCard'
import { DiaryPlayer } from '@/components/diary/DiaryPlayer'
import { cn } from '@/lib/utils'
import type { DailyDiary } from '@/types/diary'

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toLocaleDateString('sv-SE') // 'YYYY-MM-DD' locale-independent
}

function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  return toDateString(date)
}

// ─── mini week card ──────────────────────────────────────────────────────────

function WeekCard({
  diary,
  active,
  onClick,
}: {
  diary: DailyDiary
  active: boolean
  onClick: () => void
}) {
  const [, m, d] = diary.diaryDate.split('-')
  const moodEmoji = diary.mood ? MOOD_EMOJI[diary.mood] : '📝'
  const firstLine = diary.content.split('\n').find((l) => l.trim()) ?? ''
  const preview = firstLine.length > 30 ? firstLine.slice(0, 30) + '…' : firstLine

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all hover:shadow-sm',
        active ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/40',
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold text-muted-foreground">{m}/{d}</span>
        <span className="text-sm">{moodEmoji}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{preview}</p>
    </button>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function DiaryPage() {
  const today = toDateString(new Date())
  const [currentDate, setCurrentDate] = useState(today)
  const [diary, setDiary] = useState<DailyDiary | null>(null)
  const [recentDiaries, setRecentDiaries] = useState<DailyDiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingRecent, setIsLoadingRecent] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  // Fetch a single diary by date
  const fetchDiary = useCallback(async (date: string) => {
    setIsLoading(true)
    setDiary(null)
    try {
      const res = await fetch(`/api/diary?date=${date}`)
      if (res.status === 404) {
        setDiary(null)
      } else if (res.ok) {
        const json = await res.json() as { diary: DailyDiary | null }
        setDiary(json.diary)
      }
    } catch (err) {
      console.error('[DiaryPage] fetchDiary error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch recent 7 diaries for the week strip
  const fetchRecent = useCallback(async () => {
    setIsLoadingRecent(true)
    try {
      const res = await fetch('/api/diary?limit=7')
      if (res.ok) {
        const json = await res.json() as { diaries: DailyDiary[] }
        setRecentDiaries(json.diaries ?? [])
      }
    } catch (err) {
      console.error('[DiaryPage] fetchRecent error:', err)
    } finally {
      setIsLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    void fetchDiary(currentDate)
  }, [currentDate, fetchDiary])

  useEffect(() => {
    void fetchRecent()
  }, [fetchRecent])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: currentDate }),
      })
      if (res.ok) {
        const json = await res.json() as { diary: DailyDiary }
        setDiary(json.diary)
        // Refresh recent list
        void fetchRecent()
      }
    } catch (err) {
      console.error('[DiaryPage] generate error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [currentDate, fetchRecent])

  // 백업 내보내기 (마크다운)
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/diary/export?format=markdown')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voxcierge-diary-${toDateString(new Date())}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('일기장이 다운로드되었습니다')
    } catch {
      toast.error('내보내기에 실패했습니다')
    } finally {
      setIsExporting(false)
    }
  }, [])

  // 30일 이전 일기 정리
  const handleCleanup = useCallback(async () => {
    if (!confirm('30일 이전의 일기를 삭제합니다. 먼저 백업하셨나요?')) return
    setIsCleaning(true)
    try {
      const res = await fetch('/api/diary', { method: 'DELETE' })
      if (res.ok) {
        const json = await res.json() as { deleted: number }
        toast.success(`${json.deleted}개의 오래된 일기가 정리되었습니다`)
        void fetchRecent()
      }
    } catch {
      toast.error('정리에 실패했습니다')
    } finally {
      setIsCleaning(false)
    }
  }, [fetchRecent])

  const goToPrev = () => setCurrentDate((d) => addDays(d, -1))
  const goToNext = () => {
    const next = addDays(currentDate, 1)
    if (next <= today) setCurrentDate(next)
  }
  const isFuture = addDays(currentDate, 1) > today

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">소설 일기장</h1>
            <p className="text-xs text-muted-foreground">AI가 써주는 나만의 이야기</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => void handleExport()}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            백업
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground hover:text-destructive"
            onClick={() => void handleCleanup()}
            disabled={isCleaning}
          >
            {isCleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            정리
          </Button>
        </div>
      </div>

      {/* 30일 보관 안내 */}
      <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        💡 일기는 <strong>30일간</strong> 보관됩니다. 오래된 일기를 보존하려면 <strong>백업</strong> 버튼으로 내보내세요.
      </p>

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToPrev}
          aria-label="이전 날"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <p className="text-sm font-semibold">{formatKoreanDate(currentDate)}</p>
          {currentDate === today && (
            <p className="text-[10px] text-muted-foreground mt-0.5">오늘</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToNext}
          disabled={isFuture}
          aria-label="다음 날"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main diary card */}
      <DiaryCard
        diary={diary}
        isLoading={isLoading}
        isGenerating={isGenerating}
        dateLabel={formatKoreanDate(currentDate)}
        onGenerate={() => void handleGenerate()}
      />

      {/* TTS Player — only when diary exists */}
      {diary && (
        <DiaryPlayer diary={diary} />
      )}

      {/* Weekly preview strip */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">최근 일기</h2>
        {isLoadingRecent ? (
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : recentDiaries.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              아직 작성된 일기가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {recentDiaries.map((d) => (
              <WeekCard
                key={d.id}
                diary={d}
                active={d.diaryDate === currentDate}
                onClick={() => setCurrentDate(d.diaryDate)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
