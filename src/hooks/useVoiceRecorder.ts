'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceRecorder } from '@/lib/voice/recorder'
import { WebSpeechRecognizer } from '@/lib/voice/webspeech'
import type { RecordingState } from '@/types/voice'

interface UseVoiceRecorderReturn {
  recordingState: RecordingState
  interimTranscript: string
  finalTranscript: string
  audioBlob: Blob | null
  duration: number
  error: string | null
  mediaStream: MediaStream | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
}

export function useVoiceRecorder(language = 'ko-KR'): UseVoiceRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  const recorderRef = useRef<VoiceRecorder | null>(null)
  const recognizerRef = useRef<WebSpeechRecognizer | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(durationRef.current)
    }, 1000)
  }, [stopTimer])

  const startRecording = useCallback(async () => {
    setError(null)
    setInterimTranscript('')
    setFinalTranscript('')
    setAudioBlob(null)
    setDuration(0)
    durationRef.current = 0

    try {
      const recorder = new VoiceRecorder()
      recorderRef.current = recorder

      await recorder.start()
      setMediaStream(recorder.getStream())
      setRecordingState('recording')
      startTimer()

      // Start Web Speech for real-time transcript if supported
      if (WebSpeechRecognizer.isSupported()) {
        const recognizer = new WebSpeechRecognizer({ language, continuous: true, interimResults: true })
        recognizerRef.current = recognizer

        recognizer.start({
          onInterimResult: (text) => setInterimTranscript(text),
          onFinalResult: (text) => {
            setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text))
            setInterimTranscript('')
          },
          onError: (err) => {
            // Non-fatal: Web Speech errors don't stop the MediaRecorder
            console.warn('Web Speech error:', err)
          },
          onEnd: () => {
            setInterimTranscript('')
          },
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '녹음을 시작할 수 없습니다.')
      setRecordingState('idle')
    }
  }, [language, startTimer])

  const stopRecording = useCallback(async () => {
    stopTimer()
    setRecordingState('processing')

    // Stop Web Speech
    if (recognizerRef.current) {
      recognizerRef.current.stop()
      recognizerRef.current = null
    }
    setInterimTranscript('')

    // Stop MediaRecorder and get blob
    if (recorderRef.current) {
      try {
        const blob = await recorderRef.current.stop()
        setAudioBlob(blob)
        setMediaStream(null)
        recorderRef.current = null
      } catch (err) {
        setError(err instanceof Error ? err.message : '녹음 중지 중 오류가 발생했습니다.')
        setRecordingState('idle')
        return
      }
    }

    setRecordingState('idle')
  }, [stopTimer])

  const pauseRecording = useCallback(() => {
    if (recordingState !== 'recording') return
    stopTimer()
    recorderRef.current?.pause()
    recognizerRef.current?.stop()
    setRecordingState('paused')
  }, [recordingState, stopTimer])

  const resumeRecording = useCallback(() => {
    if (recordingState !== 'paused') return
    recorderRef.current?.resume()
    startTimer()
    setRecordingState('recording')

    // Restart Web Speech if supported
    if (WebSpeechRecognizer.isSupported()) {
      const recognizer = new WebSpeechRecognizer({ language, continuous: true, interimResults: true })
      recognizerRef.current = recognizer
      recognizer.start({
        onInterimResult: (text) => setInterimTranscript(text),
        onFinalResult: (text) => {
          setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text))
          setInterimTranscript('')
        },
        onError: (err) => console.warn('Web Speech error:', err),
        onEnd: () => setInterimTranscript(''),
      })
    }
  }, [recordingState, language, startTimer])

  const resetRecording = useCallback(() => {
    stopTimer()
    recognizerRef.current?.stop()
    recognizerRef.current = null
    recorderRef.current?.destroy()
    recorderRef.current = null
    setRecordingState('idle')
    setInterimTranscript('')
    setFinalTranscript('')
    setAudioBlob(null)
    setDuration(0)
    durationRef.current = 0
    setError(null)
    setMediaStream(null)
  }, [stopTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      recognizerRef.current?.stop()
      recorderRef.current?.destroy()
    }
  }, [stopTimer])

  return {
    recordingState,
    interimTranscript,
    finalTranscript,
    audioBlob,
    duration,
    error,
    mediaStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  }
}
