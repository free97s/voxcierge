'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const WEEKS_TO_SHOW = 12
const DAYS_PER_WEEK = 7
const DAYS_KO_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const

const MONTHS_KO = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
] as const

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-muted'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-primary/20'
  if (ratio < 0.5) return 'bg-primary/45'
  if (ratio < 0.75) return 'bg-primary/70'
  return 'bg-primary'
}

interface WeeklyHeatmapProps {
  /** Map from ISO date string "YYYY-MM-DD" to completion count */
  data: Record<string, number>
  className?: string
}

export function WeeklyHeatmap({ data, className }: WeeklyHeatmapProps) {
  const { grid, monthLabels, maxCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the Sunday of the current week
    const endSunday = new Date(today)
    endSunday.setDate(today.getDate() + (6 - today.getDay()))

    // Start 12 weeks (84 days) back from the Sunday of this week
    const startDate = new Date(endSunday)
    startDate.setDate(endSunday.getDate() - WEEKS_TO_SHOW * 7 + 1)

    // Build grid: [weekIndex][dayOfWeek] = { date, count }
    type Cell = { dateKey: string; count: number; date: Date }
    const weeks: Cell[][] = []
    let maxCount = 0

    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const week: Cell[] = []
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + w * 7 + d)
        const key = toDateKey(date)
        const count = data[key] ?? 0
        if (count > maxCount) maxCount = count
        week.push({ dateKey: key, count, date })
      }
      weeks.push(week)
    }

    // Build month labels: find where each month starts in the week grid
    const monthLabels: { label: string; weekIndex: number }[] = []
    let lastMonth = -1
    for (let w = 0; w < weeks.length; w++) {
      const firstDay = weeks[w][0].date
      const month = firstDay.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS_KO[month], weekIndex: w })
        lastMonth = month
      }
    }

    return { grid: weeks, monthLabels, maxCount }
  }, [data])

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-max">
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 28 }}>
          {Array.from({ length: WEEKS_TO_SHOW }).map((_, w) => {
            const label = monthLabels.find((m) => m.weekIndex === w)
            return (
              <div key={w} className="w-5 shrink-0 text-[10px] text-muted-foreground">
                {label ? label.label : ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0">
          {/* Day-of-week labels on the left */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS_KO_SHORT.map((day, i) => (
              <div
                key={day}
                className="h-4 w-5 text-[9px] text-muted-foreground flex items-center"
              >
                {/* Only show Mon, Wed, Fri labels to keep it clean */}
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heat cells */}
          <div className="flex gap-0.5">
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col gap-0.5">
                {week.map((cell) => (
                  <div
                    key={cell.dateKey}
                    className={cn(
                      'h-4 w-4 rounded-sm transition-colors',
                      intensityClass(cell.count, maxCount),
                    )}
                    title={`${cell.dateKey}: ${cell.count}개 완료`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end pr-0.5">
          <span className="text-[10px] text-muted-foreground">적음</span>
          {['bg-muted', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary'].map(
            (cls) => (
              <div key={cls} className={cn('h-3 w-3 rounded-sm', cls)} />
            ),
          )}
          <span className="text-[10px] text-muted-foreground">많음</span>
        </div>
      </div>
    </div>
  )
}
