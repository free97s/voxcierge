'use client'

import Link from 'next/link'
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon, UserIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority } from '@/types/task'

// TaskCard uses a Link wrapper for semantic navigation instead of div+onClick

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: '대기중',  className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  in_progress: { label: '진행중',  className: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400'   },
  completed:   { label: '완료',    className: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400'  },
  postponed:   { label: '연기됨',  className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  cancelled:   { label: '취소됨',  className: 'bg-gray-100   text-gray-600   dark:bg-gray-800/50   dark:text-gray-400'   },
}

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------
const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  1: { label: 'P1', className: 'bg-gray-100   text-gray-600   dark:bg-gray-800   dark:text-gray-400'   },
  2: { label: 'P2', className: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30 dark:text-blue-400'   },
  3: { label: 'P3', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  4: { label: 'P4', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  5: { label: 'P5', className: 'bg-red-100    text-red-700    dark:bg-red-900/30  dark:text-red-400'    },
}

// ---------------------------------------------------------------------------
// Due date label helper
// ---------------------------------------------------------------------------
function formatDueDate(dueAt: string): { label: string; overdue: boolean } {
  const date = new Date(dueAt)
  const overdue = isPast(date) && !isToday(date)

  if (overdue) return { label: '기한 초과', overdue: true }
  if (isToday(date)) return { label: '오늘 마감', overdue: false }
  if (isTomorrow(date)) return { label: '내일 마감', overdue: false }

  const rel = formatDistanceToNow(date, { addSuffix: false, locale: ko })
  return { label: `${rel} 후`, overdue: false }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TaskCardProps {
  task: Task
  onStatusChange?: (task: Task) => void
  onEdit?: (task: Task) => void
  onCheckin?: (task: Task) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TaskCard({ task, onStatusChange, onEdit, onCheckin }: TaskCardProps) {
  const status = statusConfig[task.status]
  const priority = priorityConfig[task.priority]
  const due = task.dueAt ? formatDueDate(task.dueAt) : null
  const isCompleted = task.status === 'completed' || task.status === 'cancelled'

  function handleActionClick(e: React.MouseEvent, fn?: (t: Task) => void) {
    e.preventDefault()
    e.stopPropagation()
    fn?.(task)
  }

  return (
    <Card className="transition-shadow hover:shadow-md active:shadow-sm">
      <Link href={`/tasks/${task.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          {/* Priority indicator strip */}
          <div
            className={cn(
              'mt-1 h-4 w-1 shrink-0 rounded-full',
              task.priority === 5 ? 'bg-red-500'    :
              task.priority === 4 ? 'bg-orange-500' :
              task.priority === 3 ? 'bg-yellow-500' :
              task.priority === 2 ? 'bg-blue-500'   :
                                    'bg-gray-400'
            )}
          />

          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  'text-sm font-medium leading-snug',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </p>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status badge */}
              <span
                className={cn(
                  'inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium',
                  status.className
                )}
              >
                {status.label}
              </span>

              {/* Priority badge */}
              <span
                className={cn(
                  'inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium',
                  priority.className
                )}
              >
                {priority.label}
              </span>

              {/* Due date */}
              {due && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px]',
                    due.overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {due.label}
                </span>
              )}

              {/* Person */}
              {task.person && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <UserIcon className="h-3 w-3" />
                  {task.person}
                </span>
              )}

              {/* Place */}
              {task.place && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPinIcon className="h-3 w-3" />
                  {task.place}
                </span>
              )}
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="h-4 px-1.5 text-[10px]">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 4 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                    +{task.tags.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
            {onCheckin && !isCompleted && (
              <Button
                variant="ghost"
                size="xs"
                className="text-[11px] h-6"
                onClick={(e) => handleActionClick(e, onCheckin)}
              >
                체크인
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="xs"
                className="text-[11px] h-6"
                onClick={(e) => handleActionClick(e, onEdit)}
              >
                편집
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      </Link>
    </Card>
  )
}
