'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarIcon, ExternalLinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EventCard } from '@/components/calendar/EventCard'
import type { CalendarEvent, CalendarConnection } from '@/types/calendar'

interface UpcomingEventsState {
  events: CalendarEvent[]
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isTomorrow(iso: string): boolean {
  const d = new Date(iso)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  )
}

function dayLabel(iso: string): string {
  if (isToday(iso)) return '오늘'
  if (isTomorrow(iso)) return '내일'
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
}

export function UpcomingEvents() {
  const [state, setState] = useState<UpcomingEventsState>({
    events: [],
    isConnected: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Check connections
        const connRes = await fetch('/api/calendar/connections').catch(() => null)
        if (!connRes || !connRes.ok) {
          if (!cancelled) {
            setState({ events: [], isConnected: false, isLoading: false, error: null })
          }
          return
        }
        const connections: CalendarConnection[] = await connRes.json()
        const hasActive = connections.some((c) => c.isActive)
        if (!hasActive) {
          if (!cancelled) {
            setState({ events: [], isConnected: false, isLoading: false, error: null })
          }
          return
        }

        // Fetch upcoming events (today + tomorrow)
        const evRes = await fetch('/api/calendar/events?days=2&limit=5').catch(() => null)
        if (!evRes || !evRes.ok) {
          if (!cancelled) {
            setState({ events: [], isConnected: true, isLoading: false, error: '일정을 불러오지 못했습니다.' })
          }
          return
        }
        const events: CalendarEvent[] = await evRes.json()
        if (!cancelled) {
          setState({ events, isConnected: true, isLoading: false, error: null })
        }
      } catch {
        if (!cancelled) {
          setState({ events: [], isConnected: false, isLoading: false, error: null })
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  if (state.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            오늘의 일정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!state.isConnected) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            오늘의 일정
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">캘린더가 연결되지 않았습니다</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Google 또는 Outlook 캘린더를 연결하면 일정이 표시됩니다
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            render={<Link href="/settings/calendar" />}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            캘린더 연결하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state.error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            오늘의 일정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{state.error}</p>
        </CardContent>
      </Card>
    )
  }

  const grouped: Record<string, CalendarEvent[]> = {}
  for (const ev of state.events) {
    const label = dayLabel(ev.startAt)
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(ev)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            오늘의 일정
          </CardTitle>
          <Button
            variant="ghost"
            size="xs"
            className="gap-1 text-muted-foreground"
            render={<Link href="/settings/calendar" />}
          >
            <ExternalLinkIcon className="h-3 w-3" />
            전체 보기
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.events.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">오늘과 내일 일정이 없습니다 🎉</p>
        ) : (
          Object.entries(grouped).map(([label, evs]) => (
            <div key={label} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              {evs.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
