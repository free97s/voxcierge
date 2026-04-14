export type DiaryMood = 'great' | 'good' | 'neutral' | 'tired' | 'tough'

export interface DiaryStats {
  completed: number
  added: number
  postponed: number
  voiceSessions: number
}

export interface DailyDiary {
  id: string
  userId: string
  diaryDate: string         // ISO date string 'YYYY-MM-DD'
  content: string           // AI-generated markdown diary text
  mood: DiaryMood | null
  highlights: string[]      // array of highlight strings
  stats: DiaryStats
  audioUrl: string | null
  createdAt: string
  updatedAt: string
}
