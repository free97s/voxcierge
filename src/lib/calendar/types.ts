// ─────────────────────────────────────────────────────────────────────────────
// Calendar integration shared types
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarProvider = 'google' | 'outlook'

export interface CalendarConnection {
  id: string
  userId: string
  provider: CalendarProvider
  /** AES-256-GCM encrypted, base64-encoded */
  accessToken: string
  /** AES-256-GCM encrypted, base64-encoded */
  refreshToken: string | null
  tokenExpiresAt: string | null
  calendarId: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  userId: string
  connectionId: string
  externalId: string
  title: string
  description: string | null
  startAt: string   // ISO 8601
  endAt: string     // ISO 8601
  location: string | null
  isAllDay: boolean
  status: string
  sourceProvider: CalendarProvider
  rawData: Record<string, unknown> | null
  syncedAt: string
  createdAt: string
}

/** A plain event payload used when creating events via API */
export interface NewCalendarEvent {
  title: string
  description?: string
  startAt: string   // ISO 8601
  endAt: string     // ISO 8601
  location?: string
  isAllDay?: boolean
}

export interface ConflictResult {
  hasConflict: boolean
  conflictingEvents: CalendarEvent[]
  /** AI-generated explanation of the conflict */
  explanation?: string
  /** AI-suggested alternative time slots */
  alternatives?: TimeSlot[]
}

export interface TimeSlot {
  startAt: string   // ISO 8601
  endAt: string     // ISO 8601
  /** Human-readable label, e.g. "오전 10시 ~ 11시" */
  label: string
  /** Why this slot was recommended */
  reason: string
}

/** Raw Google Calendar API event shape (minimal) */
export interface GoogleEventRaw {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  location?: string
  status?: string
}

/** Raw Microsoft Graph Calendar event shape (minimal) */
export interface OutlookEventRaw {
  id: string
  subject?: string
  body?: { content?: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  location?: { displayName?: string }
  isAllDay?: boolean
  showAs?: string
}

/** Token info returned after OAuth exchange */
export interface OAuthTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  email: string | null
  calendarId: string | null
}
