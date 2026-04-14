'use client'

import { useCallback, useState } from 'react'
import type { ExtractedIntent } from '@/types/ai'

interface UseTranscriptionReturn {
  isTranscribing: boolean
  isAnalyzing: boolean
  transcript: string | null
  intent: ExtractedIntent | null
  error: string | null
  transcribe: (audioBlob: Blob) => Promise<void>
  reset: () => void
}

export function useTranscription(): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [intent, setIntent] = useState<ExtractedIntent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(async (audioBlob: Blob) => {
    setError(null)
    setTranscript(null)
    setIntent(null)

    // Step 1: Transcribe audio → text
    setIsTranscribing(true)
    let transcribedText: string

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}))
        throw new Error(body?.error ?? `음성 변환 실패 (${transcribeRes.status})`)
      }

      const transcribeData = await transcribeRes.json()
      transcribedText = transcribeData.text as string
      setTranscript(transcribedText)
    } catch (err) {
      setError(err instanceof Error ? err.message : '음성 변환 중 오류가 발생했습니다.')
      return
    } finally {
      setIsTranscribing(false)
    }

    // Step 2: Analyze text → ExtractedIntent
    setIsAnalyzing(true)

    try {
      const analyzeRes = await fetch('/api/voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcribedText }),
      })

      if (!analyzeRes.ok) {
        const body = await analyzeRes.json().catch(() => ({}))
        throw new Error(body?.error ?? `의도 분석 실패 (${analyzeRes.status})`)
      }

      const analyzeData = await analyzeRes.json()
      setIntent(analyzeData.intent as ExtractedIntent)
    } catch (err) {
      setError(err instanceof Error ? err.message : '의도 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsTranscribing(false)
    setIsAnalyzing(false)
    setTranscript(null)
    setIntent(null)
    setError(null)
  }, [])

  return {
    isTranscribing,
    isAnalyzing,
    transcript,
    intent,
    error,
    transcribe,
    reset,
  }
}
