import { generateObject, zodSchema } from 'ai'
import { z } from 'zod'
import { getModel } from './gateway'
import type { Task } from '@/types/task'
import type { Insight, Recommendation } from '@/types/insights'

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const InsightsSchema = z.object({
  productiveDays: z
    .array(z.string())
    .describe('가장 생산적인 요일 목록 (한국어, 예: ["월", "화"])'),
  productiveTimes: z
    .array(z.string())
    .describe('가장 생산적인 시간대 목록 (예: ["09:00-11:00", "14:00-16:00"])'),
  taskCategories: z
    .record(z.string(), z.number())
    .describe('작업 카테고리별 완료 수 매핑'),
  recommendations: z
    .array(
      z.object({
        type: z.string().describe('추천 유형 (예: time_block, priority, habit)'),
        message: z.string().describe('한국어로 작성된 구체적인 추천 메시지'),
        priority: z.number().int().min(1).max(5).describe('우선순위 (1=낮음, 5=높음)'),
      }),
    )
    .min(1)
    .max(5),
})

type InsightsOutput = z.infer<typeof InsightsSchema>

export async function generateInsights(
  userId: string,
  tasks: Task[],
  period: { start: Date; end: Date },
): Promise<Omit<Insight, 'id' | 'generatedAt'>> {
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0

  // Build day-of-week completion counts
  const dayCompletionCounts: Record<string, number> = {}
  const dayTotalCounts: Record<string, number> = {}

  for (const task of tasks) {
    const created = new Date(task.createdAt)
    const dayIdx = created.getDay()
    const dayLabel = DAYS_KO[dayIdx]
    dayTotalCounts[dayLabel] = (dayTotalCounts[dayLabel] ?? 0) + 1
    if (task.status === 'completed') {
      dayCompletionCounts[dayLabel] = (dayCompletionCounts[dayLabel] ?? 0) + 1
    }
  }

  // Day-of-week completion rates for the prompt
  const dayRates = DAYS_KO.map((day) => {
    const total = dayTotalCounts[day] ?? 0
    const done = dayCompletionCounts[day] ?? 0
    const rate = total > 0 ? Math.round((done / total) * 100) : 0
    return `${day}: ${done}/${total}개 완료 (${rate}%)`
  }).join('\n')

  // Build completion-time distribution for hour-of-day
  const hourCounts: Record<number, number> = {}
  for (const task of completedTasks) {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours()
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
    }
  }
  const hourSummary = Object.entries(hourCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, cnt]) => `${h}시: ${cnt}개`)
    .join(', ')

  const taskTitles = completedTasks
    .slice(0, 20)
    .map((t) => `- ${t.title}`)
    .join('\n')

  const prompt = `사용자 ${userId}의 업무 패턴을 분석하여 인사이트를 생성해주세요.

**분석 기간**: ${period.start.toLocaleDateString('ko-KR')} ~ ${period.end.toLocaleDateString('ko-KR')}

**전체 완료율**: ${(completionRate * 100).toFixed(1)}% (${completedTasks.length}/${totalTasks}개)

**요일별 완료 현황**:
${dayRates}

**시간대별 완료 분포**:
${hourSummary || '데이터 없음'}

**최근 완료된 작업 (최대 20개)**:
${taskTitles || '없음'}

위 데이터를 기반으로 다음을 분석해주세요:
1. 가장 생산적인 요일 2-3개 선정
2. 가장 생산적인 시간대 1-2개 선정
3. 작업 카테고리 분류 (업무, 개인, 건강, 학습 등)
4. 구체적이고 실천 가능한 추천사항 2-4개 (한국어)

모든 추천 메시지는 친근하고 격려하는 톤으로 한국어로 작성해주세요.`

  const result = await generateObject({
    model: getModel('insights'),
    schema: zodSchema(InsightsSchema),
    system: `당신은 VoxCierge AI 업무 분석 전문가입니다.
사용자의 할 일 완료 패턴을 분석하여 생산성 향상을 위한 통찰과 추천을 제공합니다.
모든 응답은 반드시 한국어로 작성하세요.`,
    prompt,
  })

  const parsed = result.object as InsightsOutput

  const recommendations: Recommendation[] = parsed.recommendations.map((r) => ({
    type: r.type,
    message: r.message,
    priority: r.priority,
  }))

  return {
    userId,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    productiveDays: parsed.productiveDays,
    productiveTimes: parsed.productiveTimes,
    taskCategories: parsed.taskCategories,
    completionRate,
    recommendations,
    modelUsed: 'anthropic/claude-sonnet-4-5',
  }
}
