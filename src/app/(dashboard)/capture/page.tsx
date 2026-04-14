'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useTranscription } from '@/hooks/useTranscription'
import type { ExtractedIntent } from '@/types/ai'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  type: 'user-voice' | 'ai-response' | 'system'
  timestamp: Date
  // user-voice
  transcript?: string
  duration?: number
  // ai-response
  intent?: ExtractedIntent
  taskCreated?: boolean
  taskTitle?: string
  // system
  systemText?: string
}

// ---------------------------------------------------------------------------
// Chat bubble components
// ---------------------------------------------------------------------------

function UserBubble({ msg }: { msg: ChatMessage }) {
  const mins = msg.duration ? Math.floor(msg.duration / 60) : 0
  const secs = msg.duration ? msg.duration % 60 : 0

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5">
          <p className="text-sm leading-relaxed">{msg.transcript}</p>
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          <span>{mins}:{String(secs).padStart(2, '0')}</span>
          <span>·</span>
          <span>{msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}

function AiBubble({ msg, onSave, isSaving }: {
  msg: ChatMessage
  onSave: (intent: ExtractedIntent) => void
  isSaving: boolean
}) {
  const intent = msg.intent
  if (!intent) return null

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">AI</div>
          <span className="text-[10px] text-muted-foreground">
            {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-3 space-y-2.5">
            {/* Intent summary */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{intent.action}</p>
              <div className="flex flex-wrap gap-1">
                {intent.person && <Badge variant="secondary" className="text-[10px]">👤 {intent.person}</Badge>}
                {intent.place && <Badge variant="secondary" className="text-[10px]">📍 {intent.place}</Badge>}
                {intent.timeRaw && <Badge variant="secondary" className="text-[10px]">⏰ {intent.timeRaw}</Badge>}
                {intent.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>신뢰도: {Math.round(intent.confidence * 100)}%</span>
              </div>
            </div>

            {/* Actions */}
            {msg.taskCreated ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                할 일로 저장됨: {msg.taskTitle}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={() => onSave(intent)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  할 일로 저장
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SystemBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <span className="text-[10px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
        {msg.systemText}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CapturePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'system',
      timestamp: new Date(),
      systemText: '세션이 시작되었습니다 · 대화 내용은 세션 종료 시 사라집니다',
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    recordingState,
    interimTranscript,
    finalTranscript,
    audioBlob,
    duration,
    error: recorderError,
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

  const processedBlobRef = useRef<Blob | null>(null)
  const processedIntentRef = useRef<ExtractedIntent | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, interimTranscript])

  // When recording stops and blob is ready, transcribe
  useEffect(() => {
    if (audioBlob && audioBlob !== processedBlobRef.current) {
      processedBlobRef.current = audioBlob
      transcribe(audioBlob)
    }
  }, [audioBlob, transcribe])

  // When intent is ready, add to chat
  useEffect(() => {
    if (intent && intent !== processedIntentRef.current) {
      processedIntentRef.current = intent

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user-voice',
        timestamp: new Date(),
        transcript: transcript ?? finalTranscript ?? '(인식 실패)',
        duration,
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai-response',
        timestamp: new Date(),
        intent,
        taskCreated: false,
      }

      setMessages((prev) => [...prev, userMsg, aiMsg])

      // Reset for next recording
      resetRecording()
      resetTranscription()
      processedBlobRef.current = null
    }
  }, [intent, transcript, finalTranscript, duration, resetRecording, resetTranscription])

  // Handle errors
  useEffect(() => {
    const error = recorderError ?? transcriptionError
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'system',
          timestamp: new Date(),
          systemText: `⚠️ ${error}`,
        },
      ])
    }
  }, [recorderError, transcriptionError])

  const handleMicClick = useCallback(async () => {
    if (recordingState === 'recording') {
      await stopRecording()
    } else {
      resetRecording()
      resetTranscription()
      processedBlobRef.current = null
      processedIntentRef.current = null
      await startRecording()
    }
  }, [recordingState, startRecording, stopRecording, resetRecording, resetTranscription])

  const handleSave = useCallback(async (intent: ExtractedIntent, msgId: string) => {
    setIsSaving(true)
    setSavingMsgId(msgId)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: intent.action,
          person: intent.person,
          place: intent.place,
          dueAt: intent.timeAbsolute,
          tags: intent.tags,
          intentType: intent.intentType,
          confidence: intent.confidence,
        }),
      })

      if (!res.ok) throw new Error('저장 실패')

      // Update the message to show saved state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, taskCreated: true, taskTitle: intent.action } : m
        )
      )
      toast.success('할 일이 추가되었습니다')
    } catch {
      toast.error('할 일 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
      setSavingMsgId(null)
    }
  }, [])

  const handleClearSession = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        type: 'system',
        timestamp: new Date(),
        systemText: '세션이 초기화되었습니다 · 대화 내용은 세션 종료 시 사라집니다',
      },
    ])
    resetRecording()
    resetTranscription()
    processedBlobRef.current = null
    processedIntentRef.current = null
    toast.success('세션이 초기화되었습니다')
  }, [resetRecording, resetTranscription])

  const isRecording = recordingState === 'recording'
  const isProcessing = isTranscribing || isAnalyzing

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">음성 어시스턴트</h1>
          <Badge variant="outline" className="text-[10px]">
            {messages.filter((m) => m.type === 'user-voice').length}건의 대화
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
          onClick={handleClearSession}
        >
          <Trash2 className="h-3 w-3" />
          세션 초기화
        </Button>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (msg.type === 'system') return <SystemBubble key={msg.id} msg={msg} />
          if (msg.type === 'user-voice') return <UserBubble key={msg.id} msg={msg} />
          if (msg.type === 'ai-response') {
            return (
              <AiBubble
                key={msg.id}
                msg={msg}
                onSave={(intent) => void handleSave(intent, msg.id)}
                isSaving={isSaving && savingMsgId === msg.id}
              />
            )
          }
          return null
        })}

        {/* Live recording indicator */}
        {isRecording && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <span className="text-sm text-muted-foreground">
                  {interimTranscript || '듣고 있습니다...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              </div>
              {isTranscribing ? '음성을 텍스트로 변환 중...' : 'AI가 분석 중...'}
            </div>
          </div>
        )}
      </div>

      {/* Session notice + Mic bar */}
      <div className="border-t bg-card px-4 py-3 shrink-0 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertCircle className="h-2.5 w-2.5" />
          대화 내용은 이 세션에서만 유지됩니다 · 페이지를 떠나면 사라집니다
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => void handleMicClick()}
            disabled={isProcessing}
            aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isRecording
                ? 'bg-destructive text-destructive-foreground hover:scale-105'
                : 'bg-primary text-primary-foreground hover:scale-105',
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {isRecording && (
            <span className="font-mono text-sm tabular-nums text-destructive font-medium">
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
