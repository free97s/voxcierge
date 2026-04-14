'use client'

import { Clock, TrendingUp, Lightbulb, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/types/insights'

const PRIORITY_CONFIG = {
  5: { label: '매우 높음', color: 'bg-red-500', barColor: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
  4: { label: '높음', color: 'bg-orange-500', barColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
  3: { label: '보통', color: 'bg-yellow-500', barColor: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
  2: { label: '낮음', color: 'bg-blue-500', barColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
  1: { label: '참고', color: 'bg-gray-400', barColor: 'bg-gray-400', textColor: 'text-muted-foreground' },
} as const

const TYPE_ICONS: Record<string, React.ElementType> = {
  time_block: Clock,
  priority: TrendingUp,
  habit: Zap,
  default: Lightbulb,
}

function getTypeIcon(type: string): React.ElementType {
  return TYPE_ICONS[type] ?? TYPE_ICONS.default
}

function getPriorityConfig(priority: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(priority))) as 1 | 2 | 3 | 4 | 5
  return PRIORITY_CONFIG[clamped]
}

interface RecommendationCardProps {
  recommendation: Recommendation
  index: number
}

function RecommendationItem({ recommendation, index }: RecommendationCardProps) {
  const config = getPriorityConfig(recommendation.priority)
  const Icon = getTypeIcon(recommendation.type)

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          'bg-primary/10',
        )}
      >
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">
            추천 {index + 1}
          </span>
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0', config.textColor)}
          >
            <span
              className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', config.color)}
            />
            {config.label}
          </Badge>
        </div>

        <p className="text-sm text-foreground leading-snug">
          {recommendation.message}
        </p>

        {/* Priority bar */}
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', config.barColor)}
              style={{ width: `${(recommendation.priority / 5) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {recommendation.priority}/5
          </span>
        </div>
      </div>
    </div>
  )
}

interface OptimalTimeCardProps {
  recommendations: Recommendation[]
  className?: string
}

export function OptimalTimeCard({ recommendations, className }: OptimalTimeCardProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={cn('rounded-lg bg-muted/50 px-4 py-8 text-center', className)}>
        <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          아직 추천 데이터가 없습니다. 할 일을 더 등록하고 완료해 보세요.
        </p>
      </div>
    )
  }

  // Sort by priority descending
  const sorted = [...recommendations].sort((a, b) => b.priority - a.priority)

  return (
    <div className={cn('space-y-3', className)}>
      {sorted.map((rec, i) => (
        <RecommendationItem key={`${rec.type}-${i}`} recommendation={rec} index={i} />
      ))}
    </div>
  )
}
