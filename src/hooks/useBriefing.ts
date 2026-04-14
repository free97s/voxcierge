'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Briefing, BriefingType } from '@/types/briefing'

interface BriefingState {
  briefing: Briefing | null
  type: BriefingType | null
  needsGeneration: boolean
  isLoading: boolean
  isGenerating: boolean
  error: string | null
}

interface UseBriefingReturn extends BriefingState {
  generateBriefing: () => Promise<void>
  refresh: () => Promise<void>
}

function mapDbBriefing(raw: Record<string, unknown>): Briefing {
  return {
    id: raw.id as string,
    userId: (raw.user_id ?? raw.userId) as string,
    type: (raw.type ?? 'adhoc') as BriefingType,
    content: raw.content as string,
    ttsUrl: raw.tts_url as string | undefined,
    tasksSummary: (raw.tasks_summary ?? raw.tasksSummary ?? {}) as Record<string, unknown>,
    modelUsed: raw.model_used as string | undefined,
    generatedAt: (raw.generated_at ?? raw.generatedAt) as string,
    deliveredAt: (raw.delivered_at ?? raw.deliveredAt) as string | undefined,
    readAt: (raw.read_at ?? raw.readAt) as string | undefined,
  }
}

export function useBriefing(): UseBriefingReturn {
  const [state, setState] = useState<BriefingState>({
    briefing: null,
    type: null,
    needsGeneration: false,
    isLoading: true,
    isGenerating: false,
    error: null,
  })

  const fetchBriefing = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/briefing', {
        headers: { 'x-timezone': tz },
        cache: 'no-store',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as {
        briefing?: Record<string, unknown> | null
        type?: BriefingType
        needsGeneration?: boolean
      }

      setState({
        briefing: data.briefing ? mapDbBriefing(data.briefing) : null,
        type: data.type ?? null,
        needsGeneration: data.needsGeneration ?? false,
        isLoading: false,
        isGenerating: false,
        error: null,
      })
    } catch (err) {
      console.error('[useBriefing] fetch error:', err)
      setState((prev) => ({
        ...prev,
        briefing: null,
        needsGeneration: true,
        isLoading: false,
        error: null,
      }))
    }
  }, [])

  useEffect(() => {
    void fetchBriefing()
  }, [fetchBriefing])

  const generateBriefing = useCallback(async () => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null }))
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/briefing/generate', {
        method: 'POST',
        headers: { 'x-timezone': tz },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as { briefing?: Record<string, unknown> }
      const briefing = data.briefing ? mapDbBriefing(data.briefing) : null

      setState((prev) => ({
        ...prev,
        briefing,
        needsGeneration: false,
        isGenerating: false,
        error: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : '브리핑 생성에 실패했습니다',
      }))
    }
  }, [])

  return {
    ...state,
    generateBriefing,
    refresh: fetchBriefing,
  }
}
