'use client'

import { Mic, RefreshCw, Clock, Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Briefing, BriefingType } from '@/types/briefing'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<BriefingType, string> = {
  morning: '아침 브리핑',
  evening: '저녁 브리핑',
  adhoc: '브리핑',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 생성'
  if (minutes < 60) return `${minutes}분 전 생성`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전 생성`
  return `${Math.floor(hours / 24)}일 전 생성`
}

// Minimal markdown renderer: bold, italic, headings, bullets, line breaks
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />

        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">
              {line.slice(3)}
            </h2>
          )
        }
        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-semibold mt-2 mb-0.5 text-foreground">
              {line.slice(4)}
            </h3>
          )
        }
        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-lg font-bold mt-3 mb-1 text-foreground">
              {line.slice(2)}
            </h1>
          )
        }
        // Bullet
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 text-foreground">
              <span className="text-muted-foreground shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          )
        }
        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s(.+)/)
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2 text-foreground">
              <span className="text-muted-foreground shrink-0">{numberedMatch[1]}.</span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          )
        }
        // Normal paragraph
        return (
          <p key={i} className="text-foreground">
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Bold + italic combined: ***text***
  // Bold: **text**
  // Italic: *text* or _text_
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/)
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) {
      return <strong key={i}><em>{part.slice(3, -3)}</em></strong>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

interface BriefingCardProps {
  briefing: Briefing | null
  isLoading: boolean
  isGenerating: boolean
  onGenerate: () => void
  type?: BriefingType | null
  className?: string
}

export function BriefingCard({
  briefing,
  isLoading,
  isGenerating,
  onGenerate,
  type,
  className,
}: BriefingCardProps) {
  const label = type ? TYPE_LABELS[type] : '오늘의 브리핑'

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-52 mt-1" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            {label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              AI 생성
            </Badge>
            {briefing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onGenerate}
                disabled={isGenerating}
                title="브리핑 다시 생성"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isGenerating && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
        {briefing && (
          <CardDescription className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(briefing.generatedAt)}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {briefing ? (
          <MarkdownContent content={briefing.content} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/50 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              오늘의 브리핑이 아직 준비되지 않았습니다.
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
                  브리핑 생성하기
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
