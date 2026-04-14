'use client'

import { MapPinIcon, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function ProviderIcon({ provider }: { provider: 'google' | 'outlook' }) {
  if (provider === 'google') {
    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold leading-none"
        style={{ background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC04 75%, #EA4335 100%)' }}
        title="Google Calendar"
        aria-label="Google Calendar"
      >
        <span className="text-white">G</span>
      </span>
    )
  }
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-[#0078D4] text-[9px] font-bold leading-none text-white"
      title="Outlook Calendar"
      aria-label="Outlook Calendar"
    >
      O
    </span>
  )
}

export interface EventCardProps {
  event: CalendarEvent
  variant?: 'default' | 'conflict' | 'new'
  className?: string
}

export function EventCard({ event, variant = 'default', className }: EventCardProps) {
  const startTime = formatTime(event.startAt)
  const endTime = formatTime(event.endAt)

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
        variant === 'default' && 'border-primary/30 bg-primary/5',
        variant === 'conflict' && 'border-destructive/40 bg-destructive/5',
        variant === 'new' && 'border-primary/60 bg-primary/10',
        className,
      )}
    >
      {/* Time stripe */}
      <div
        className={cn(
          'mt-0.5 h-full w-0.5 shrink-0 self-stretch rounded-full',
          variant === 'conflict' ? 'bg-destructive' : 'bg-primary',
        )}
      />

      <div className="min-w-0 flex-1 space-y-1">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          <ProviderIcon provider={event.sourceProvider} />
          <p
            className={cn(
              'truncate font-medium leading-snug',
              variant === 'conflict' && 'text-destructive',
            )}
          >
            {event.title}
          </p>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3 shrink-0" />
          {event.isAllDay ? (
            <span>종일</span>
          ) : (
            <span>
              {startTime} ~ {endTime}
            </span>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}
