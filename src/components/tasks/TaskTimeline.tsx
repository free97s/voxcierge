'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  PlusCircleIcon,
  PencilIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  BellIcon,
  MessageSquareIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskHistory, TaskHistoryAction } from '@/types/task'

// ---------------------------------------------------------------------------
// Action config
// ---------------------------------------------------------------------------
type ActionConfig = {
  label: string
  icon: React.ElementType
  iconClassName: string
  dotClassName: string
}

const actionConfig: Record<TaskHistoryAction, ActionConfig> = {
  created: {
    label: '생성됨',
    icon: PlusCircleIcon,
    iconClassName: 'text-green-600 dark:text-green-400',
    dotClassName: 'bg-green-500',
  },
  updated: {
    label: '수정됨',
    icon: PencilIcon,
    iconClassName: 'text-blue-600 dark:text-blue-400',
    dotClassName: 'bg-blue-500',
  },
  completed: {
    label: '완료됨',
    icon: CheckCircle2Icon,
    iconClassName: 'text-green-600 dark:text-green-400',
    dotClassName: 'bg-green-600',
  },
  postponed: {
    label: '연기됨',
    icon: ClockIcon,
    iconClassName: 'text-orange-600 dark:text-orange-400',
    dotClassName: 'bg-orange-500',
  },
  cancelled: {
    label: '취소됨',
    icon: XCircleIcon,
    iconClassName: 'text-gray-500 dark:text-gray-400',
    dotClassName: 'bg-gray-400',
  },
  checkin_sent: {
    label: '체크인 발송',
    icon: BellIcon,
    iconClassName: 'text-purple-600 dark:text-purple-400',
    dotClassName: 'bg-purple-500',
  },
  checkin_responded: {
    label: '체크인 응답',
    icon: MessageSquareIcon,
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
    dotClassName: 'bg-indigo-500',
  },
}

// ---------------------------------------------------------------------------
// Metadata renderer
// ---------------------------------------------------------------------------
function MetaDetail({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([k, v]) => v != null && !['action'].includes(k)
  )
  if (entries.length === 0) return null

  const labelMap: Record<string, string> = {
    postponed_until: '연기 날짜',
    checkin_action: '체크인 응답',
    due_at: '기한',
    title: '제목',
    description: '설명',
    priority: '우선순위',
    status: '상태',
    person: '담당자',
    place: '장소',
  }

  const valueMap: Record<string, (v: unknown) => string> = {
    checkin_action: (v) =>
      v === 'completed' ? '완료' :
      v === 'postponed' ? '연기' :
      v === 'cancelled' ? '취소' : String(v),
    postponed_until: (v) => {
      try {
        return format(new Date(String(v)), 'yyyy년 M월 d일', { locale: ko })
      } catch {
        return String(v)
      }
    },
    due_at: (v) => {
      try {
        return format(new Date(String(v)), 'yyyy년 M월 d일', { locale: ko })
      } catch {
        return String(v)
      }
    },
  }

  return (
    <dl className="mt-1 space-y-0.5">
      {entries.map(([key, value]) => {
        const label = labelMap[key] ?? key
        const formatted = valueMap[key] ? valueMap[key](value) : String(value)
        return (
          <div key={key} className="flex gap-1.5 text-[11px] text-muted-foreground">
            <dt className="shrink-0">{label}:</dt>
            <dd className="truncate">{formatted}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TaskTimelineProps {
  history: TaskHistory[]
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TaskTimeline({ history, className }: TaskTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        히스토리가 없습니다.
      </p>
    )
  }

  // Sort oldest→newest for display (newest first in list)
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

      <ol className="space-y-4">
        {sorted.map((entry, idx) => {
          const config = actionConfig[entry.action] ?? {
            label: entry.action,
            icon: PencilIcon,
            iconClassName: 'text-muted-foreground',
            dotClassName: 'bg-muted-foreground',
          }
          const Icon = config.icon

          return (
            <li key={entry.id} className="relative flex items-start gap-3 pl-8">
              {/* Dot */}
              <span
                className={cn(
                  'absolute left-[10px] top-[7px] h-2.5 w-2.5 rounded-full ring-2 ring-background',
                  config.dotClassName
                )}
              />

              {/* Icon */}
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClassName)} />

              {/* Content */}
              <div className="min-w-0 flex-1 -mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{config.label}</span>
                  <time className="text-[11px] text-muted-foreground shrink-0">
                    {format(new Date(entry.createdAt), 'M월 d일 HH:mm', { locale: ko })}
                  </time>
                </div>
                {Object.keys(entry.metadata).length > 0 && (
                  <MetaDetail metadata={entry.metadata} />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
