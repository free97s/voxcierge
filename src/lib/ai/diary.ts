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
    system: `당신은 사용자의 하루를 따뜻하게 정리해주는 일기 작성 도우미입니다.
오늘 완료한 일, 새로 추가된 일, 연기한 일, 음성 메모 내용을 바탕으로
1인칭 시점('오늘은...')의 자연스러운 한국어 일기를 작성해주세요.
분량은 200~400자, 따뜻하고 격려하는 톤으로 작성합니다.
마지막에 하루의 기분을 이모지로 표현해주세요.`,
    prompt,
  })

  const mood = extractMood(text)
  const highlights = extractHighlights(completedTasks)

  return { content: text, mood, highlights, stats }
}
