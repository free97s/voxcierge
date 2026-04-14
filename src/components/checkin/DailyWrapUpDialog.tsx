'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle2, Clock, Trash2, CalendarIcon, Trophy, ListTodo, Plus } from 'lucide-react'
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
import type { DailyStats } from '@/hooks/useSmartCheckin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type WrapAction = 'complete' | 'postpone' | 'cancel'

interface WrapItemState {
  action: WrapAction | null
  isLoading: boolean
}

interface DailyWrapUpDialogProps {
  open: boolean
  stats: DailyStats
  pendingTasks: Task[]
  onComplete: () => void
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center">
      <Icon className={cn('h-5 w-5', colorClass)} />
      <p className={cn('text-2xl font-bold tabular-nums', colorClass)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single pending task row in wrap-up
// ---------------------------------------------------------------------------
function WrapUpTaskRow({
  task,
  state,
  onAction,
}: {
  task: Task
  state: WrapItemState
  onAction: (action: WrapAction) => void
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
              기한: {format(new Date(task.dueAt), 'M월 d일 (eee)', { locale: ko })}
            </p>
          )}
        </div>
        {isActioned && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {state.action === 'complete' ? '완료' : state.action === 'postpone' ? '내일로' : '삭제'}
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
            내일로
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={state.isLoading}
            onClick={() => onAction('cancel')}
            className="flex-1 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------
export function DailyWrapUpDialog({ open, stats, pendingTasks, onComplete }: DailyWrapUpDialogProps) {
  const [itemStates, setItemStates] = useState<Record<string, WrapItemState>>(() =>
    Object.fromEntries(pendingTasks.map((t) => [t.id, { action: null, isLoading: false }]))
  )
  const [isBatchLoading, setIsBatchLoading] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = tomorrow.toISOString()

  async function callBatchUpdate(taskIds: string[], action: 'complete' | 'postpone' | 'cancel', postponeDate?: string) {
    const res = await fetch('/api/tasks/batch-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds, action, postponeDate }),
    })
    if (!res.ok) {
      const json = await res.json() as { error?: string }
      throw new Error(json.error ?? '업데이트 실패')
    }
    return res.json()
  }

  async function handleItemAction(taskId: string, action: WrapAction) {
    setItemStates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], isLoading: true },
    }))

    try {
      await callBatchUpdate(
        [taskId],
        action,
        action === 'postpone' ? tomorrowIso : undefined
      )

      setItemStates((prev) => ({
        ...prev,
        [taskId]: { action, isLoading: false },
      }))

      const messages: Record<WrapAction, string> = {
        complete: '완료 처리했습니다.',
        postpone: '내일로 이동했습니다.',
        cancel: '삭제했습니다.',
      }
      toast.success(messages[action])
    } catch (err) {
      setItemStates((prev) => ({
        ...prev,
        [taskId]: { action: null, isLoading: false },
      }))
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  async function handleMoveAllTomorrow() {
    const unarchivedIds = pendingTasks
      .filter((t) => itemStates[t.id]?.action === null)
      .map((t) => t.id)

    if (unarchivedIds.length === 0) {
      toast.info('처리할 항목이 없어요.')
      return
    }

    setIsBatchLoading(true)
    try {
      await callBatchUpdate(unarchivedIds, 'postpone', tomorrowIso)

      setItemStates((prev) => {
        const next = { ...prev }
        unarchivedIds.forEach((id) => {
          next[id] = { action: 'postpone', isLoading: false }
        })
        return next
      })

      toast.success(`${unarchivedIds.length}개 항목을 내일로 이동했습니다.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsBatchLoading(false)
    }
  }

  function handleWrapUp() {
    onComplete()
    toast.success('오늘도 수고하셨습니다! 내일도 화이팅 💜')
  }

  const unarchivedCount = pendingTasks.filter((t) => itemStates[t.id]?.action === null).length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleWrapUp() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base">
            오늘 하루 수고하셨습니다! 📋
          </DialogTitle>
          <DialogDescription>
            {format(new Date(), 'yyyy년 M월 d일 (eee)', { locale: ko })} 마감 요약
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={CheckCircle2}
            label="완료"
            value={stats.completed}
            colorClass="text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={ListTodo}
            label="미완료"
            value={stats.pending}
            colorClass="text-orange-500 dark:text-orange-400"
          />
          <StatCard
            icon={Plus}
            label="새로 추가"
            value={stats.added}
            colorClass="text-violet-600 dark:text-violet-400"
          />
        </div>

        {/* Pending tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                미완료 항목
              </p>
              {unarchivedCount > 0 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleMoveAllTomorrow}
                  disabled={isBatchLoading}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-900/20"
                >
                  <Clock className="h-3 w-3" />
                  내일로 일괄 이동
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-0.5">
              {pendingTasks.map((task) => (
                <WrapUpTaskRow
                  key={task.id}
                  task={task}
                  state={itemStates[task.id] ?? { action: null, isLoading: false }}
                  onAction={(action) => handleItemAction(task.id, action)}
                />
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <p className="text-sm font-medium">오늘 모든 할 일을 완료했어요!</p>
            <p className="text-xs text-muted-foreground">정말 대단해요 🎉</p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleWrapUp}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            하루 마감하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
