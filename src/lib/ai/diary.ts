import { generateText } from 'ai'
import { getModel } from './gateway'
import type { DiaryMood, DiaryStats } from '@/types/diary'

interface RawTask {
  id: string
  title: string
  status: string
  created_at: string
  completed_at?: string | null
  postponed_until?: string | null
}

interface RawVoiceSession {
  id: string
  transcript?: string | null
}

interface GenerateDiaryResult {
  content: string
  mood: DiaryMood
  highlights: string[]
  stats: DiaryStats
}

function extractMood(text: string): DiaryMood {
  const last200 = text.slice(-200).toLowerCase()
  if (last200.includes('🌟') || last200.includes('최고') || last200.includes('훌륭')) return 'great'
  if (last200.includes('😊') || last200.includes('좋은') || last200.includes('잘 됐')) return 'good'
  if (last200.includes('😴') || last200.includes('피곤') || last200.includes('지쳤')) return 'tired'
  if (last200.includes('💪') || last200.includes('힘들') || last200.includes('어려웠')) return 'tough'
  return 'neutral'
}

function extractHighlights(tasks: RawTask[]): string[] {
  return tasks
    .filter((t) => t.status === 'completed')
    .slice(0, 5)
    .map((t) => t.title)
}

export async function generateDailyDiary(
  userId: string,
  date: string,
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
): Promise<GenerateDiaryResult> {
  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  // Fetch tasks created on this date
  const [completedResult, addedResult, postponedResult, voiceResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, created_at, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd),

    supabase
      .from('tasks')
      .select('id, title, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),

    supabase
      .from('tasks')
      .select('id, title, status, postponed_until')
      .eq('user_id', userId)
      .eq('status', 'postponed')
      .gte('updated_at', dayStart)
      .lte('updated_at', dayEnd),

    supabase
      .from('voice_sessions')
      .select('id, transcript')
      .eq('user_id', userId)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
  ])

  const completedTasks: RawTask[] = (completedResult.data ?? []) as RawTask[]
  const addedTasks: RawTask[] = (addedResult.data ?? []) as RawTask[]
  const postponedTasks: RawTask[] = (postponedResult.data ?? []) as RawTask[]
  const voiceSessions: RawVoiceSession[] = (voiceResult.data ?? []) as RawVoiceSession[]

  const stats: DiaryStats = {
    completed: completedTasks.length,
    added: addedTasks.length,
    postponed: postponedTasks.length,
    voiceSessions: voiceSessions.length,
  }

  const transcriptSummary = voiceSessions
    .filter((s) => s.transcript)
    .map((s) => `- ${s.transcript!.slice(0, 80)}`)
    .join('\n')

  const prompt = `오늘 날짜: ${date}

완료한 일 (${completedTasks.length}개):
${completedTasks.map((t) => `- ${t.title}`).join('\n') || '없음'}

새로 추가한 일 (${addedTasks.length}개):
${addedTasks.map((t) => `- ${t.title}`).join('\n') || '없음'}

연기한 일 (${postponedTasks.length}개):
${postponedTasks.map((t) => `- ${t.title}`).join('\n') || '없음'}

음성 메모 (${voiceSessions.length}회):
${transcriptSummary || '없음'}

위 내용을 바탕으로 오늘 하루를 정리하는 일기를 작성해주세요.`

  const { text } = await generateText({
    model: getModel('briefing'),
    system: `당신은 사용자의 하루를 짧은 소설처럼 써주는 AI 작가입니다.

## 스타일 가이드
- **소설체 1인칭 서술**: "오늘, 나는..." 으로 시작하는 문학적 톤
- 완료한 일은 **영웅담/성취 서사**로 표현 ("드디어 그 과제를 해치웠다", "마침내 정복했다")
- 연기한 일은 **내일의 복선/떡밥**으로 표현 ("하지만 아직 끝나지 않은 이야기가 있다...", "내일의 나에게 바통을 넘겼다")
- 못한 일은 **좌절이 아닌 전략적 후퇴**로 ("전략적으로 보류했다", "때를 기다리기로 했다")
- 음성 메모가 있으면 **독백/내면의 소리**처럼 인용
- 하루 전체를 하나의 짧은 에피소드처럼 기승전결 구조로
- 마지막은 **내일에 대한 기대감**으로 마무리

## 규칙
- 분량: 300~500자 (짧은 소설 한 편)
- 한국어, 격식체와 구어체 적절히 섞기
- 과도한 이모지 사용 금지 (마지막 기분 이모지 1개만)
- 할 일이 없는 날도 "고요한 하루"로 아름답게 표현
- 개조식(bullet) 금지 — 오직 서술형 문장으로만`,
    prompt,
  })

  const mood = extractMood(text)
  const highlights = extractHighlights(completedTasks)

  return { content: text, mood, highlights, stats }
}
