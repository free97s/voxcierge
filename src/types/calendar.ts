export interface CalendarConnection {
  id: string
  provider: 'google' | 'outlook'
  email: string | null
  isActive: boolean
  lastSyncedAt: string | null
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string
  location: string | null
  isAllDay: boolean
  status: string
  sourceProvider: 'google' | 'outlook'
}

export interface ConflictResult {
  hasConflict: boolean
  conflicts: CalendarEvent[]
  suggestedTimes: {
    startAt: string
    endAt: string
    reason: string
  }[]
}
