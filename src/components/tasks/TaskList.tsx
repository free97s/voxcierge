'use client'

import Link from 'next/link'
import { ClipboardListIcon, MicIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
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
function EmptyState({ message, showCaptureCta }: { message: string; showCaptureCta?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-14 text-center">
      <ClipboardListIcon className="h-9 w-9 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {showCaptureCta && (
        <Link
          href="/capture"
          className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-2 mt-1'}
        >
          <MicIcon className="h-4 w-4" />
          음성으로 추가
        </Link>
      )}
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
  showCaptureCta?: boolean
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
  showCaptureCta = false,
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
    return <EmptyState message={emptyMessage} showCaptureCta={showCaptureCta} />
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
