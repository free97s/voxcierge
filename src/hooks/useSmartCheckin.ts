'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@/types/task'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DailyStats {
  completed: number
  pending: number
  added: number
}

export interface SmartCheckinReturn {
  needsCheckin: boolean
  pendingTasks: Task[]
  completeCheckin: () => void
  needsWrapUp: boolean
  todayStats: DailyStats
  wrapUpPendingTasks: Task[]
  completeWrapUp: () => void
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// Local-storage key helpers
// ---------------------------------------------------------------------------
const CHECKIN_KEY = 'lastCheckinDate'
const WRAPUP_KEY = 'lastWrapUpDate'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function isEveningTime(): boolean {
  return new Date().getHours() >= 18
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSmartCheckin(): SmartCheckinReturn {
  const [needsCheckin, setNeedsCheckin] = useState(false)
  const [needsWrapUp, setNeedsWrapUp] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [wrapUpPendingTasks, setWrapUpPendingTasks] = useState<Task[]>([])
  const [todayStats, setTodayStats] = useState<DailyStats>({ completed: 0, pending: 0, added: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/daily-summary')
      if (!res.ok) {
        // Supabase not configured or user not logged in — graceful empty state
        setIsLoading(false)
        return
      }

      const data = await res.json() as {
        stats: DailyStats
        pendingDueTodayOrOverdue: Task[]
        yesterdayPending: Task[]
      }

      const today = todayDateString()

      // --- Check-in logic ---
      const lastCheckin = typeof window !== 'undefined'
        ? localStorage.getItem(CHECKIN_KEY)
        : null
      const alreadyCheckedIn = lastCheckin === today

      // Combine today-due/overdue + yesterday pending (deduplicated by id)
      const checkinCandidates = [
        ...data.pendingDueTodayOrOverdue,
        ...data.yesterdayPending,
      ].filter((task, index, arr) => arr.findIndex((t) => t.id === task.id) === index)

      if (!alreadyCheckedIn && checkinCandidates.length > 0) {
        setPendingTasks(checkinCandidates.slice(0, 5))
        setNeedsCheckin(true)
      } else {
        setNeedsCheckin(false)
      }

      // --- Wrap-up logic ---
      const lastWrapUp = typeof window !== 'undefined'
        ? localStorage.getItem(WRAPUP_KEY)
        : null
      const alreadyWrappedUp = lastWrapUp === today

      setTodayStats(data.stats)
      setWrapUpPendingTasks(data.pendingDueTodayOrOverdue)

      if (!alreadyWrappedUp && isEveningTime()) {
        setNeedsWrapUp(true)
      } else {
        setNeedsWrapUp(false)
      }
    } catch {
      // Network error or Supabase not configured — silently no-op
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const completeCheckin = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHECKIN_KEY, todayDateString())
    }
    setNeedsCheckin(false)
  }, [])

  const completeWrapUp = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WRAPUP_KEY, todayDateString())
    }
    setNeedsWrapUp(false)
  }, [])

  return {
    needsCheckin,
    pendingTasks,
    completeCheckin,
    needsWrapUp,
    todayStats,
    wrapUpPendingTasks,
    completeWrapUp,
    isLoading,
  }
}
