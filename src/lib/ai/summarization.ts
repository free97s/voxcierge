import { generateText } from 'ai'
import { getModel } from './gateway'

interface Task {
  id: string
  title: string
  due_at?: string | null
  priority?: string | null
}

export async function generateBriefingSummary(
  tasks: Task[],
  completedTasks: Task[],
  overdueTasks: Task[],
  userName: string,
): Promise<string> {
  const { text } = await generateText({
    model: getModel('briefing'),
    system: `당신은 VoxCierge AI 비서입니다. 사용자의 할 일 현황을 간결하고 친근하게 요약해주세요.
응답은 반드시 한국어로 작성하며, 마크다운 형식을 사용하세요.
핵심 정보만 전달하고 불필요한 내용은 생략하세요.`,
    prompt: `${userName}님의 할 일 브리핑을 작성해주세요.

**오늘 할 일 (${tasks.length}개)**
${tasks.map(t => `- ${t.title}${t.due_at ? ` (${t.due_at})` : ''}`).join('\n') || '없음'}

**완료된 항목 (${completedTasks.length}개)**
${completedTasks.map(t => `- ${t.title}`).join('\n') || '없음'}

**기한 초과 (${overdueTasks.length}개)**
${overdueTasks.map(t => `- ${t.title}${t.due_at ? ` (${t.due_at})` : ''}`).join('\n') || '없음'}`,
  })

  return text
}
