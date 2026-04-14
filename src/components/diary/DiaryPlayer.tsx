'use client'

import { useState, useCallback } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BriefingPlayer } from '@/components/briefing/BriefingPlayer'
import type { DailyDiary } from '@/types/diary'

interface DiaryPlayerProps {
  diary: DailyDiary
  className?: string
}

type TtsState = 'idle' | 'loading' | 'ready' | 'error'

export function DiaryPlayer({ diary, className }: DiaryPlayerProps) {
  const [ttsState, setTtsState] = useState<TtsState>(diary.audioUrl ? 'ready' : 'idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(diary.audioUrl)

  const handleGenerateTts = useCallback(async () => {
    setTtsState('loading')
    try {
      const response = await fetch('/api/diary/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaryId: diary.id }),
      })
      if (!response.ok) throw new Error('TTS generation failed')
      const json = await response.json() as { audioUrl?: string | null }
      setAudioUrl(json.audioUrl ?? null)
      setTtsState('ready')
    } catch (err) {
      console.error('[DiaryPlayer] TTS error:', err)
      // Fall back to browser TTS
      setTtsState('ready')
    }
  }, [diary.id])

  if (ttsState === 'idle') {
    return (
      <Button
        variant="outline"
        className="gap-2 w-full"
        onClick={() => void handleGenerateTts()}
      >
        <Volume2 className="h-4 w-4" />
        일기 읽어주기 🔊
      </Button>
    )
  }

  if (ttsState === 'loading') {
    return (
      <Button variant="outline" className="gap-2 w-full" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        음성 생성 중...
      </Button>
    )
  }

  // ready or error — show the full player
  return (
    <BriefingPlayer
      ttsUrl={audioUrl}
      briefingContent={diary.content}
      autoPlay={false}
      className={className}
    />
  )
}
