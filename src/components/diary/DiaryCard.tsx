'use client'

import { CheckCircle2, Plus, Clock, Mic, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DailyDiary, DiaryMood } from '@/types/diary'

export const MOOD_EMOJI: Record<DiaryMood, string> = {
  great: '🌟',
  good: '😊',
  neutral: '😐',
  tired: '😴',
  tough: '💪',
}

export const MOOD_LABEL: Record<DiaryMood, string> = {
  great: '최고의 하루',
  good: '좋은 하루',
  neutral: '평범한 하루',
  tired: '피곤한 하루',
  tough: '힘든 하루',
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-lg font-bold mt-3 mb-1 text-foreground">
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 text-foreground">
              <span className="text-muted-foreground shrink-0">•</span>
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        return <p key={i} className="text-foreground">{line}</p>
      })}
    </div>
  )
}

interface DiaryCardProps {
  diary: DailyDiary | null
  isLoading: boolean
  isGenerating: boolean
  dateLabel: string
  onGenerate: () => void
  className?: string
}

export function DiaryCard({
  diary,
  isLoading,
  isGenerating,
  dateLabel,
  onGenerate,
  className,
}: DiaryCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28 mt-1" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  const mood = diary?.mood ?? null
  const moodEmoji = mood ? MOOD_EMOJI[mood] : null
  const moodLabel = mood ? MOOD_LABEL[mood] : null

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold leading-tight">
              {dateLabel}
            </CardTitle>
            {moodEmoji && (
              <span className="text-xl" title={moodLabel ?? undefined}>{moodEmoji}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              AI 일기
            </Badge>
            {diary && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onGenerate}
                disabled={isGenerating}
                title="일기 다시 생성"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isGenerating && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
        {moodLabel && (
          <CardDescription className="text-xs">{moodLabel}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {diary ? (
          <>
            {/* Diary text */}
            <MarkdownContent content={diary.content} />

            {/* Highlights */}
            {diary.highlights.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">주요 성과</p>
                <div className="flex flex-wrap gap-1.5">
                  {diary.highlights.map((h, i) => (
                    <Badge key={i} variant="secondary" className="text-xs max-w-[200px] truncate">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatChip
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                label="완료"
                value={diary.stats.completed}
              />
              <StatChip
                icon={<Plus className="h-3.5 w-3.5 text-blue-500" />}
                label="추가"
                value={diary.stats.added}
              />
              <StatChip
                icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
                label="연기"
                value={diary.stats.postponed}
              />
              <StatChip
                icon={<Mic className="h-3.5 w-3.5 text-purple-500" />}
                label="음성"
                value={diary.stats.voiceSessions}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              이 날의 일기가 아직 작성되지 않았습니다.
            </p>
            <Button onClick={onGenerate} disabled={isGenerating} size="sm" className="gap-2">
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  일기 생성하기
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1.5">
      {icon}
      <span className="text-xs font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
