'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TranscriptPreviewProps {
  interimText: string
  finalText: string
  isListening: boolean
}

export function TranscriptPreview({ interimText, finalText, isListening }: TranscriptPreviewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [interimText, finalText])

  const isEmpty = !finalText && !interimText

  return (
    <div className="w-full rounded-lg border bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">실시간 텍스트</span>
        {isListening && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            듣는 중
          </span>
        )}
      </div>

      {/* Transcript body */}
      <div
        ref={containerRef}
        className="max-h-40 overflow-y-auto px-4 py-3 scroll-smooth"
      >
        {isEmpty ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isListening ? '말씀하세요...' : '녹음된 텍스트가 없습니다'}
          </p>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {finalText && (
              <span className="font-normal text-foreground">{finalText}</span>
            )}
            {finalText && interimText && ' '}
            {interimText && (
              <span
                className={cn(
                  'font-light italic text-muted-foreground',
                  isListening && 'animate-pulse'
                )}
              >
                {interimText}
              </span>
            )}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
