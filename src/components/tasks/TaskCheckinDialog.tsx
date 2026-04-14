'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Task, CheckinAction } from '@/types/task'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TaskCheckinDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (task: Task) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TaskCheckinDialog({
  task,
  isOpen,
  onClose,
  onSuccess,
}: TaskCheckinDialogProps) {
  const [selectedAction, setSelectedAction] = useState<CheckinAction | null>(null)
  const [postponeDate, setPostponeDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (isSubmitting) return
    setSelectedAction(null)
    setPostponeDate('')
    setError(null)
    onClose()
  }

  async function handleSubmit() {
    if (!task || !selectedAction) return
    if (selectedAction === 'postponed' && !postponeDate) {
      setError('연기 날짜를 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = { action: selectedAction }
      if (selectedAction === 'postponed') {
        body.postponedUntil = new Date(postponeDate).toISOString()
      }

      const res = await fetch(`/api/tasks/${task.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? '요청에 실패했습니다.')
      }

      const { task: updatedTask } = await res.json() as { task: Task }
      onSuccess?.(updatedTask)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Minimum date for postpone is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const actions: Array<{
    value: CheckinAction
    label: string
    description: string
    icon: React.ElementType
    className: string
    activeClassName: string
  }> = [
    {
      value: 'completed',
      label: '완료',
      description: '이 작업을 완료로 표시합니다',
      icon: CheckCircle2Icon,
      className: 'border-green-200 hover:border-green-400 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/20',
      activeClassName: 'border-green-500 bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500/30',
    },
    {
      value: 'postponed',
      label: '연기',
      description: '나중으로 미룹니다',
      icon: ClockIcon,
      className: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-900 dark:hover:bg-orange-900/20',
      activeClassName: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 ring-2 ring-orange-500/30',
    },
    {
      value: 'cancelled',
      label: '취소',
      description: '이 작업을 취소합니다',
      icon: XCircleIcon,
      className: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
      activeClassName: 'border-gray-500 bg-gray-50 dark:bg-gray-800 ring-2 ring-gray-500/30',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>작업 체크인</DialogTitle>
          <DialogDescription>
            이 작업의 진행 상태를 업데이트하세요.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            {/* Task info */}
            <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-1">
              <p className="text-sm font-medium leading-snug">{task.title}</p>
              {task.dueAt && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  원래 기한:{' '}
                  {format(new Date(task.dueAt), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                </p>
              )}
            </div>

            {/* Action selection */}
            <div className="space-y-2">
              <Label>어떻게 처리할까요?</Label>
              <div className="grid grid-cols-3 gap-2">
                {actions.map(({ value, label, description, icon: Icon, className, activeClassName }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedAction(value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
                      selectedAction === value ? activeClassName : className
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Postpone date picker */}
            {selectedAction === 'postponed' && (
              <div className="space-y-1.5">
                <Label htmlFor="postpone-date">연기 날짜</Label>
                <Input
                  id="postpone-date"
                  type="date"
                  min={minDate}
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="h-8"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAction || isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
