'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle2, Clock, SkipForward, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ItemAction = 'complete' | 'postpone' | 'skip'

interface TaskItemState {
  action: ItemAction | null
  isLoading: boolean
}

interface DailyCheckinDialogProps {
  open: boolean
  tasks: Task[]
  onComplete: () => void
}

// ---------------------------------------------------------------------------
// Single task row
// ---------------------------------------------------------------------------
function CheckinTaskRow({
  task,
  state,
  onAction,
}: {
  task: Task
  state: TaskItemState
  onAction: (action: ItemAction) => void
}) {
  const isActioned = state.action !== null

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border bg-card p-3 transition-opacity',
        isActioned && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium leading-snug', isActioned && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {task.dueAt && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3 shrink-0" />
              {format(new Date(task.dueAt), 'M월 d일 (eee)', { locale: ko })}
            </p>
          )}
        </div>
        {isActioned && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {state.action === 'complete' ? '완료' : state.action === 'postpone' ? '연기' : '건너뜀'}
          </Badge>
        )}
      </div>

      {!isActioned && (
        <div className="flex gap-1.5">
          <Button
            size="xs"
            variant="outline"
            disabled={state.isLoading}
            onClick={() => onAction('complete')}
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <CheckCircle2 className="h-3 w-3" />
            완료
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={state.isLoading}
            onClick={() => onAction('postpone')}
            className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            <Clock className="h-3 w-3" />
            연기
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={state.isLoading}
            onClick={() => onAction('skip')}
            className="flex-1 text-muted-foreground"
          >
            <SkipForward className="h-3 w-3" />
            건너뜀
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------
export function DailyCheckinDialog({ open, tasks, onComplete }: DailyCheckinDialogProps) {
  const [itemStates, setItemStates] = useState<Record<string, TaskItemState>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, { action: null, isLoading: false }]))
  )

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = tomorrow.toISOString()

  async function handleAction(taskId: string, action: ItemAction) {
    setItemStates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], isLoading: true },
    }))

    try {
      if (action === 'skip') {
        // Local-only — no API call needed
        setItemStates((prev) => ({
          ...prev,
          [taskId]: { action: 'skip', isLoading: false },
        }))
        return
      }

      const res = await fetch('/api/tasks/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: [taskId],
          action: action === 'complete' ? 'complete' : 'postpone',
          postponeDate: action === 'postpone' ? tomorrowIso : undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? '업데이트 실패')
      }

      setItemStates((prev) => ({
        ...prev,
        [taskId]: { action, isLoading: false },
      }))

      toast.success(action === 'complete' ? '완료 처리했습니다.' : '내일로 연기했습니다.')
    } catch (err) {
      setItemStates((prev) => ({
        ...prev,
        [taskId]: { action: null, isLoading: false },
      }))
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  function handleComplete() {
    onComplete()
  }

  const allActioned = tasks.every((t) => itemStates[t.id]?.action !== null)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleComplete() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base">
            안녕하세요! 확인할 할 일이 있어요 👋
          </DialogTitle>
          <DialogDescription>
            오늘 기한이거나 아직 미완료된 항목들을 확인해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
          {tasks.map((task) => (
            <CheckinTaskRow
              key={task.id}
              task={task}
              state={itemStates[task.id] ?? { action: null, isLoading: false }}
              onAction={(action) => handleAction(task.id, action)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={handleComplete}
            className={cn(
              'w-full bg-violet-600 hover:bg-violet-700 text-white',
              allActioned && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {allActioned ? '모두 확인했어요 ✓' : '모두 확인했어요'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
