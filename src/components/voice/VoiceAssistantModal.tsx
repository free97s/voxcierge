'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, Loader2, RotateCcw, CheckCircle, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TranscriptPreview } from '@/components/voice/TranscriptPreview'
import { IntentCard } from '@/components/voice/IntentCard'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useTranscription } from '@/hooks/useTranscription'
import type { ExtractedIntent } from '@/types/ai'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface VoiceAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceAssistantModal({ open, onOpenChange }: VoiceAssistantModalProps) {
  const {
    recordingState,
    interimTranscript,
    finalTranscript,
    audioBlob,
    duration,
    error: recorderError,
    mediaStream: _mediaStream,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder('ko-KR')

  const {
    isTranscribing,
    isAnalyzing,
    transcript,
    intent,
    error: transcriptionError,
    transcribe,
    reset: resetTranscription,
  } = useTranscription()

  const [isSaving, setIsSaving] = useState(false)
  const transcribedRef = useRef(false)

  const error = recorderError ?? transcriptionError

  const isRecording = recordingState === 'recording'
  const isProcessing =
    recordingState === 'processing' || isTranscribing || isAnalyzing

  const phase: 'idle' | 'recording' | 'processing' | 'result' = intent
    ? 'result'
    : isProcessing
    ? 'processing'
    : isRecording
    ? 'recording'
    : 'idle'

  // Trigger transcription when audioBlob is ready
  useEffect(() => {
    if (audioBlob && !transcribedRef.current) {
      transcribedRef.current = true
      transcribe(audioBlob)
    }
    if (!audioBlob) {
      transcribedRef.current = false
    }
  }, [audioBlob, transcribe])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetRecording()
      resetTranscription()
      setIsSaving(false)
    }
  }, [open, resetRecording, resetTranscription])

  function handleReset() {
    resetRecording()
    resetTranscription()
    setIsSaving(false)
  }

  async function handleMicClick() {
    if (phase === 'idle') {
      handleReset()
      await startRecording()
    } else if (phase === 'recording') {
      await stopRecording()
    }
  }

  const handleConfirm = useCallback(
    async (editedIntent: ExtractedIntent) => {
      setIsSaving(true)
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editedIntent.action,
            person: editedIntent.person,
            place: editedIntent.place,
            dueAt: editedIntent.timeAbsolute,
            tags: editedIntent.tags,
            intentType: editedIntent.intentType,
            confidence: editedIntent.confidence,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(
            (body as { error?: string })?.error ?? `저장 실패 (${res.status})`
          )
        }

        toast.success('할 일이 추가되었습니다')
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '할 일 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [onOpenChange]
  )

  function handleDiscard() {
    handleReset()
  }

  const processingLabel = isTranscribing
    ? '음성을 텍스트로 변환 중...'
    : isAnalyzing
    ? 'AI가 의도를 분석하고 있습니다...'
    : '처리 중...'

  const statusLabel =
    phase === 'result'
      ? '결과를 확인하고 저장하세요'
      : phase === 'processing'
      ? processingLabel
      : phase === 'recording'
      ? '말씀하세요... 완료하려면 버튼을 다시 누르세요'
      : '무엇을 도와드릴까요?'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>음성 어시스턴트</SheetTitle>
          <SheetDescription>{statusLabel}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {/* Mic button */}
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <span className="absolute inset-[-4px] rounded-full bg-destructive/25 motion-safe:animate-ping" />
                <span className="absolute inset-[-14px] rounded-full bg-destructive/10 motion-safe:animate-ping [animation-delay:200ms]" />
              </>
            )}

            <button
              onClick={handleMicClick}
              disabled={isProcessing || phase === 'result' || isSaving}
              aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
              className={cn(
                'relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-70',
                isRecording && 'bg-destructive text-destructive-foreground hover:scale-105',
                isProcessing && 'bg-muted text-muted-foreground',
                !isRecording && !isProcessing && phase !== 'result' &&
                  'bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl',
                phase === 'result' && 'bg-muted text-muted-foreground'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isRecording ? (
                <Square className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Timer during recording */}
          {isRecording && (
            <span className="font-mono text-xl font-semibold tabular-nums text-destructive">
              {formatDuration(duration)}
            </span>
          )}

          {/* Live transcript */}
          {(isRecording || isProcessing || !!transcript || !!finalTranscript) && (
            <div className="w-full">
              <TranscriptPreview
                interimText={interimTranscript}
                finalText={transcript ?? finalTranscript}
                isListening={isRecording}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              aria-live="polite"
              className="w-full rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Intent result */}
          {phase === 'result' && intent && (
            <div className="w-full">
              <IntentCard
                intent={intent}
                onConfirm={handleConfirm}
                onDiscard={handleDiscard}
                isLoading={isSaving}
              />
            </div>
          )}
        </div>

        {/* Footer actions shown only in result or idle-with-transcript states */}
        {phase === 'idle' && !intent && (
          <SheetFooter>
            {(finalTranscript || transcript) && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
