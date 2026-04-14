'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface BriefingPlayerProps {
  ttsUrl: string | null
  briefingContent: string
  autoPlay?: boolean
  className?: string
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export function BriefingPlayer({
  ttsUrl,
  briefingContent,
  autoPlay = false,
  className,
}: BriefingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [playback, setPlayback] = useState<PlaybackState>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const usingTts = !!ttsUrl

  // --- HTML Audio (when ttsUrl available) ---
  const setupAudio = useCallback(() => {
    if (!ttsUrl) return
    const audio = new Audio(ttsUrl)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('playing', () => setPlayback('playing'))
    audio.addEventListener('pause', () => setPlayback((s) => s !== 'ended' ? 'paused' : 'ended'))
    audio.addEventListener('ended', () => { setPlayback('ended'); setCurrentTime(0) })
    audio.addEventListener('error', () => setPlayback('error'))
    audio.addEventListener('waiting', () => setPlayback('loading'))
    audio.addEventListener('canplay', () => {
      if (playback === 'loading') setPlayback('paused')
    })

    if (autoPlay) {
      audio.play().catch(() => setPlayback('idle'))
    }
  }, [ttsUrl, autoPlay]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!usingTts) return
    setupAudio()
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [usingTts, setupAudio])

  // --- Browser TTS (fallback) ---
  const playSynthesis = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setPlayback('error')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(briefingContent)
    utterance.lang = 'ko-KR'
    utterance.rate = 1.0
    utterance.onstart = () => setPlayback('playing')
    utterance.onend = () => setPlayback('ended')
    utterance.onerror = () => setPlayback('error')
    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [briefingContent])

  const pauseSynthesis = useCallback(() => {
    window.speechSynthesis?.pause()
    setPlayback('paused')
  }, [])

  const resumeSynthesis = useCallback(() => {
    window.speechSynthesis?.resume()
    setPlayback('playing')
  }, [])

  // --- Unified controls ---
  const handlePlayPause = useCallback(() => {
    if (usingTts && audioRef.current) {
      if (playback === 'playing') {
        audioRef.current.pause()
      } else if (playback === 'ended') {
        audioRef.current.currentTime = 0
        void audioRef.current.play()
      } else {
        void audioRef.current.play()
      }
    } else {
      if (playback === 'playing') {
        pauseSynthesis()
      } else if (playback === 'paused') {
        resumeSynthesis()
      } else {
        playSynthesis()
      }
    }
  }, [usingTts, playback, pauseSynthesis, resumeSynthesis, playSynthesis])

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }, [])

  const handleRestart = useCallback(() => {
    if (usingTts && audioRef.current) {
      audioRef.current.currentTime = 0
      void audioRef.current.play()
    } else {
      playSynthesis()
    }
  }, [usingTts, playSynthesis])

  const handleMuteToggle = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !muted
    }
    setMuted((m) => !m)
  }, [muted])

  const isPlaying = playback === 'playing'
  const isLoading = playback === 'loading'
  const hasError = playback === 'error'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={handlePlayPause}
            disabled={isLoading || hasError}
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-0.5" />
            )}
          </Button>

          {/* Progress bar + time */}
          <div className="flex-1 space-y-1">
            <div
              className="relative h-2 rounded-full bg-muted overflow-hidden cursor-pointer"
              onClick={(e) => {
                if (!audioRef.current || !duration) return
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const ratio = x / rect.width
                audioRef.current.currentTime = ratio * duration
              }}
              role="slider"
              aria-label="재생 위치"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {usingTts && (
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Restart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRestart}
            disabled={playback === 'idle' || isLoading}
            aria-label="처음부터 재생"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* Mute (only for audio element) */}
          {usingTts && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleMuteToggle}
              aria-label={muted ? '소리 켜기' : '소리 끄기'}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Status messages */}
        {hasError && (
          <p className="mt-2 text-xs text-destructive text-center">
            오디오 재생에 실패했습니다. 브라우저 TTS를 사용해 주세요.
          </p>
        )}
        {!usingTts && (
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            브라우저 음성 합성 (TTS) 사용 중
          </p>
        )}
      </CardContent>
    </Card>
  )
}
