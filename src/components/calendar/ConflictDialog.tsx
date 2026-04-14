'use client'

import { AlertTriangleIcon, CheckIcon, ClockIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/calendar/EventCard'
import { cn } from '@/lib/utils'
import type { CalendarEvent, ConflictResult } from '@/types/calendar'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export interface ConflictDialogProps {
  isOpen: boolean
  newEvent: Pick<CalendarEvent, 'title' | 'startAt' | 'endAt'>
  conflict: ConflictResult
  onSelectTime: (startAt: string, endAt: string) => void
  onForceCreate: () => void
  onCancel: () => void
}

export function ConflictDialog({
  isOpen,
  newEvent,
  conflict,
  onSelectTime,
  onForceCreate,
  onCancel,
}: ConflictDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            일정이 겹쳐요!
          </DialogTitle>
          <DialogDescription>
            새로 등록하려는 일정이 기존 일정과 시간이 겹칩니다. AI가 대안 시간을 추천해 드릴게요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing conflicting events */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              기존 일정
            </p>
            {conflict.conflicts.map((ev) => (
              <EventCard key={ev.id} event={ev} variant="conflict" />
            ))}
          </div>

          {/* New event */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              새 일정
            </p>
            <div className="flex items-start gap-3 rounded-lg border border-primary/60 bg-primary/10 px-3 py-2.5 text-sm">
              <div className="mt-0.5 h-full w-0.5 shrink-0 self-stretch rounded-full bg-primary" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium text-primary">{newEvent.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="h-3 w-3 shrink-0" />
                  <span>
                    {formatTime(newEvent.startAt)} ~ {formatTime(newEvent.endAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI-suggested alternative times */}
          {conflict.suggestedTimes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI 추천 대안 시간
              </p>
              <div className="space-y-2">
                {conflict.suggestedTimes.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectTime(slot.startAt, slot.endAt)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary/5',
                      'px-3 py-2.5 text-left text-sm transition-colors',
                      'hover:border-primary hover:bg-primary/15 focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary">
                        {formatTime(slot.startAt)} ~ {formatTime(slot.endAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">{slot.reason}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      이 시간으로
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button variant="destructive" size="sm" onClick={onForceCreate}>
            그대로 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
