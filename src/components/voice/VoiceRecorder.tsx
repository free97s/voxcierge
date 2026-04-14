'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, Pause, Play, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AudioWaveform } from './AudioWaveform'
import { TranscriptPreview } from './TranscriptPreview'
import { IntentCard } from './IntentCard'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useTranscription } from '@/hooks/useTranscription'
import type { ExtractedIntent } from '@/types/ai'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function VoiceRecorder() {
  const {
    recordingState,
    interimTranscript,
    finalTranscript,
    audioBlob,
    duration,
    error: recorderError,
    mediaStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
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
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const transcribedRef = useRef(false)

  const error = recorderError ?? transcriptionError ?? saveError

  const isProcessing =
    isTranscribing || isAnalyzing || recordingState === 'processing'

  // Determine current display phase
  const phase: 'idle' | 'recording' | 'paused' | 'processing' | 'result' = saved
    ? 'idle'
    : intent
    ? 'result'
    : isProcessing
    ? 'processing'
    : recordingState === 'paused'
    ? 'paused'
    : recordingState === 'recording'
    ? 'recording'
    : 'idle'

  // Trigger transcription when audioBlob becomes available after stop
  useEffect(() => {
    if (audioBlob && !transcribedRef.current) {
      transcribedRef.current = true
      transcribe(audioBlob)
    }
    if (!audioBlob) {
      transcribedRef.current = false
    }
  }, [audioBlob, transcribe])

  async function handleMicClick() {
    if (phase === 'idle') {
      setSaved(false)
      setSaveError(null)
      resetTranscription()
      await startRecording()
    } else if (phase === 'recording') {
      await stopRecording()
    } else if (phase === 'paused') {
      await stopRecording()
    }
  }

  const handleConfirm = useCallback(
    async (editedIntent: ExtractedIntent) => {
      setIsSaving(true)
      setSaveError(null)

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

        setSaved(true)
        resetRecording()
        resetTranscription()
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : '할 일 저장에 실패했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    },
    [resetRecording, resetTranscription]
  )

  function handleDiscard() {
    resetRecording()
    resetTranscription()
    setSaved(false)
    setSaveError(null)
  }

  const processingLabel = isTranscribing
    ? '음성을 텍스트로 변환 중...'
    : isAnalyzing
    ? 'AI가 의도를 분석하고 있습니다...'
    : '처리 중...'

  const isRecording = phase === 'recording'
  const isPaused = phase === 'paused'
  const isResult = phase === 'result'

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      {/* ── Mic button ── */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <>
              <span className="absolute inset-[-4px] rounded-full bg-destructive/25 animate-ping" />
              <span className="absolute inset-[-14px] rounded-full bg-destructive/10 animate-ping [animation-delay:200ms]" />
            </>
          )}

          <button
            onClick={handleMicClick}
            disabled={isProcessing || isResult || isSaving}
            aria-label={
              isRecording
                ? '녹음 중지'
                : isPaused
                ? '녹음 완료'
                : '녹음 시작'
            }
            className={cn(
              'relative flex h-28 w-28 items-center justify-center rounded-full shadow-lg transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-70',
              isRecording &&
                'bg-destructive text-destructive-foreground hover:scale-105',
              isPaused && 'bg-orange-500 text-white hover:scale-105',
              isProcessing && 'bg-muted text-muted-foreground',
              !isRecording &&
                !isPaused &&
                !isProcessing &&
                !isResult &&
                'bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl',
              isResult && 'bg-muted text-muted-foreground'
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isRecording || isPaused ? (
              <Square className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>
        </div>

        {/* Timer */}
        {(isRecording || isPaused) && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-mono text-2xl font-semibold tabular-nums',
                isPaused && 'text-orange-500'
              )}
            >
              {formatDuration(duration)}
            </span>
            {isPaused && (
              <span className="text-xs font-medium text-orange-500">일시정지</span>
            )}
          </div>
        )}

        {/* Status label */}
        <p className="text-sm text-muted-foreground text-center px-4">
          {saved
            ? '할 일이 저장되었습니다!'
            : isResult
            ? '결과를 확인하고 저장하세요'
            : isProcessing
            ? processingLabel
            : isPaused
            ? '일시정지됨 — 완료하려면 버튼을 누르세요'
            : isRecording
            ? '말씀하세요... 완료하려면 버튼을 다시 누르세요'
            : '버튼을 눌러 녹음을 시작하세요'}
        </p>

        {/* Pause / Resume controls */}
        {(isRecording || isPaused) && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="gap-1.5"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  계속하기
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  일시정지
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              초기화
            </Button>
          </div>
        )}

        {/* New recording button after result / save */}
        {(isResult || saved) && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDiscard}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            새로 녹음하기
          </Button>
        )}
      </div>

      {/* ── Waveform ── */}
      <AudioWaveform mediaStream={mediaStream} isRecording={isRecording} />

      {/* ── Live transcript ── */}
      {(isRecording || isPaused || isProcessing || !!transcript || !!finalTranscript) && (
        <TranscriptPreview
          interimText={interimTranscript}
          finalText={transcript ?? finalTranscript}
          isListening={isRecording}
        />
      )}

      {/* ── Error message ── */}
      {error && (
        <div className="w-full rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Intent result card ── */}
      {isResult && intent && (
        <IntentCard
          intent={intent}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}
