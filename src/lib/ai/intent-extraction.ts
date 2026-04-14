import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './gateway'

const IntentSchema = z.object({
  intentType: z.enum(['add_task', 'complete_task', 'delete_task', 'query_tasks', 'update_task', 'other']),
  action: z.string(),
  person: z.string().nullable(),
  place: z.string().nullable(),
  timeRaw: z.string().nullable(),
  timeAbsolute: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
})

export type Intent = z.infer<typeof IntentSchema>

export async function extractIntent(transcript: string, userTimezone: string): Promise<Intent> {
  const now = new Date().toLocaleString('ko-KR', { timeZone: userTimezone })

  const { object } = await generateObject({
    model: getModel('intent'),
    schema: IntentSchema,
    system: `당신은 한국어 음성 입력을 분석하여 사용자의 의도를 추출하는 AI입니다.
사용자의 발화에서 할 일 관련 의도, 대상 인물, 장소, 시간 정보를 정확하게 파악하세요.
현재 날짜/시간: ${now} (${userTimezone})
timeAbsolute는 ISO 8601 형식으로 반환하세요. 시간 정보가 없으면 null로 설정하세요.`,
    prompt: transcript,
  })

  return object
}
