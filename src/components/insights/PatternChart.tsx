'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'] as const
type DayKo = (typeof DAYS_KO)[number]

export interface DayCompletionRate {
  day: DayKo
  rate: number  // 0-100
  completed: number
  total: number
}

interface TooltipEntry {
  active?: boolean
  payload?: Array<{ payload: DayCompletionRate }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipEntry) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold text-popover-foreground">{label}요일</p>
      <p className="text-muted-foreground">
        완료율: <span className="font-medium text-primary">{data.rate}%</span>
      </p>
      <p className="text-muted-foreground text-xs">
        {data.completed}/{data.total}개 완료
      </p>
    </div>
  )
}

interface PatternChartProps {
  data: DayCompletionRate[]
  className?: string
}

export function PatternChart({ data, className }: PatternChartProps) {
  // Ensure all days are represented, fill missing with zeros
  const normalized: DayCompletionRate[] = DAYS_KO.map((day) => {
    const found = data.find((d) => d.day === day)
    return found ?? { day, rate: 0, completed: 0, total: 0 }
  })

  return (
    <div className={className} style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalized} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
          <Bar
            dataKey="rate"
            radius={[4, 4, 0, 0]}
            fill="hsl(var(--primary))"
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
