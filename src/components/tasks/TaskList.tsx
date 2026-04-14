'use client'

import { ClipboardListIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskCard, type TaskCardProps } from './TaskCard'
import type { Task } from '@/types/task'

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------
function TaskSkeleton() {
  return (
    <div className="rounded-xl ring-1 ring-foreground/10 bg-card py-3 px-4">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-1 h-4 w-1 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-14 text-center">
      <ClipboardListIcon className="h-9 w-9 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TaskListProps {
  tasks: Task[]
  isLoading?: boolean
  emptyMessage?: string
  onStatusChange?: TaskCardProps['onStatusChange']
  onEdit?: TaskCardProps['onEdit']
  onCheckin?: TaskCardProps['onCheckin']
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TaskList({
  tasks,
  isLoading = false,
  emptyMessage = '할 일이 없습니다.',
  onStatusChange,
  onEdit,
  onCheckin,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onCheckin={onCheckin}
        />
      ))}
    </div>
  )
}
