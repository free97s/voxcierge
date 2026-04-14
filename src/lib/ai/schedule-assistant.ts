/**
 * AI-powered schedule conflict analysis and reschedule suggestion.
 *
 * Uses Vercel AI SDK `generateObject` with Zod schema.
 * Model: MODELS.intent (gpt-4.1-mini) — cost-efficient for structured output.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './gateway'
import type { CalendarEvent, NewCalendarEvent, TimeSlot } from '@/lib/calendar/types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ConflictAnalysisSchema = z.object({
  severity: z.enum(['none', 'low', 'medium', 'high']).describe(
    '충돌 심각도: none=충돌없음, low=짧은 겹침, medium=상당한 겹침, high=완전한 충돌',
  ),
  explanation: z.string().describe('충돌 상황을 한국어로 간결하게 설명 (1~2문장)'),
  canProceed: z.boolean().describe('새 일정을 그대로 추가해도 되는지 여부'),
  conflictDetails: z
    .array(
      z.object({
        eventTitle: z.string(),
        overlapMinutes: z.number().int().min(0),
        suggestion: z.string().describe('이 특정 충돌에 대한 대처 제안 (한국어)'),
      }),
    )
    .describe('각 충돌 이벤트별 세부 분석'),
})

const RescheduleSchema = z.object({
  recommendedSlot: z
    .object({
      startAt: z.string().describe('ISO 8601 형식의 추천 시작 시간'),
      endAt: z.string().describe('ISO 8601 형식의 추천 종료 시간'),
      label: z.string().describe('한국어 레이블 (예: "내일 오전 10시 ~ 11시")'),
      reason: z.string().describe('이 시간을 추천하는 이유 (한국어)'),
    })
    .nullable()
    .describe('가장 추천하는 시간대. 적합한 시간이 없으면 null'),
  alternatives: z
    .array(
      z.object({
        startAt: z.string(),
        endAt: z.string(),
        label: z.string(),
        reason: z.string(),
      }),
    )
    .max(3)
    .describe('추가 대안 시간대 (최대 3개)'),
  message: z.string().describe('전체 상황에 대한 AI 코멘트 (한국어, 1~3문장)'),
})

// ─── Public API ───────────────────────────────────────────────────────────────

export type ConflictAnalysis = z.infer<typeof ConflictAnalysisSchema>
export type RescheduleResult = z.infer<typeof RescheduleSchema>

/**
 * Analyse whether `newEvent` conflicts with `existingEvents`.
 * Returns a structured analysis with severity and per-conflict details.
 */
export async function analyzeScheduleConflict(
  existingEvents: CalendarEvent[],
  newEvent: NewCalendarEvent,
): Promise<ConflictAnalysis> {
  if (existingEvents.length === 0) {
    return {
      severity: 'none',
      explanation: '충돌하는 일정이 없습니다.',
      canProceed: true,
      conflictDetails: [],
    }
  }

  const existingSummary = existingEvents
    .map(
      (e) =>
        `- "${e.title}": ${formatTime(e.startAt)} ~ ${formatTime(e.endAt)}`,
    )
    .join('\n')

  const prompt = `새 일정을 추가하려고 합니다.

새 일정:
- 제목: "${newEvent.title}"
- 시작: ${formatTime(newEvent.startAt)}
- 종료: ${formatTime(newEvent.endAt)}

기존 캘린더 일정:
${existingSummary}

위 정보를 바탕으로 새 일정과 기존 일정 사이의 충돌을 분석해주세요.`

  const { object } = await generateObject({
    model: getModel('intent'),
    schema: ConflictAnalysisSchema,
    system: `당신은 VoxCierge의 일정 관리 AI입니다.
사용자의 캘린더 일정 충돌을 분석하고 친절하고 실용적인 조언을 제공합니다.
모든 응답은 한국어로 작성하세요.`,
    prompt,
  })

  return object
}

/**
 * Suggest rescheduling options given conflicts and available free slots.
 *
 * @param conflicts        Events that conflict with the proposed time
 * @param availableSlots   Free time slots found by suggestAlternativeTimes()
 * @param userPreferences  Optional hints (e.g. preferred morning/afternoon)
 */
export async function suggestReschedule(
  conflicts: CalendarEvent[],
  availableSlots: TimeSlot[],
  userPreferences?: string,
): Promise<RescheduleResult> {
  if (availableSlots.length === 0) {
    return {
      recommendedSlot: null,
      alternatives: [],
      message: '현재 분석된 시간대 내에 적합한 빈 시간을 찾지 못했습니다. 일정을 직접 조정해주세요.',
    }
  }

  const conflictSummary = conflicts
    .map((e) => `- "${e.title}": ${formatTime(e.startAt)} ~ ${formatTime(e.endAt)}`)
    .join('\n')

  const slotSummary = availableSlots
    .map((s, i) => `${i + 1}. ${s.label} (${s.startAt} ~ ${s.endAt})`)
    .join('\n')

  const prompt = `충돌하는 일정들:
${conflictSummary}

사용 가능한 시간대:
${slotSummary}

${userPreferences ? `사용자 선호도: ${userPreferences}` : ''}

위 정보를 바탕으로 가장 적합한 대안 시간을 추천해주세요.`

  const { object } = await generateObject({
    model: getModel('intent'),
    schema: RescheduleSchema,
    system: `당신은 VoxCierge의 일정 재조정 AI 전문가입니다.
사용자의 일정 충돌 상황을 고려하여 최적의 대안 시간을 추천합니다.
모든 응답은 친절하고 구체적인 한국어로 작성하세요.`,
    prompt,
  })

  return object
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}
