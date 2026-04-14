/**
 * Google Calendar API v3 integration (REST, no additional SDK).
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_APP_URL   — base URL for the OAuth redirect URI
 */

import type { GoogleEventRaw, NewCalendarEvent, OAuthTokens } from './types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/api/calendar/callback`
}

function requireEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set')
  }
  return { clientId, clientSecret }
}

/**
 * Build the Google OAuth2 authorization URL.
 * @param userId  Passed as `state` to verify on callback.
 */
export function getGoogleAuthUrl(userId: string): string {
  const { clientId } = requireEnv()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: `google:${userId}`,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange the authorization code for access + refresh tokens.
 */
export async function exchangeGoogleCode(code: string): Promise<OAuthTokens> {
  const { clientId, clientSecret } = requireEnv()

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type: string
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : null

  // Fetch user email
  const userInfo = await fetchGoogleUserInfo(data.access_token)

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt,
    email: userInfo.email,
    calendarId: 'primary',
  }
}

/**
 * Refresh an expired Google access token using the stored refresh token.
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const { clientId, clientSecret } = requireEnv()

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token refresh failed: ${err}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

async function fetchGoogleUserInfo(accessToken: string): Promise<{ email: string | null }> {
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return { email: null }
    const data = await res.json() as { email?: string }
    return { email: data.email ?? null }
  } catch {
    return { email: null }
  }
}

/**
 * Fetch Google Calendar events between timeMin and timeMax.
 * @param calendarId  Defaults to 'primary'.
 */
export async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEventRaw[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar fetch failed (${res.status}): ${err}`)
  }

  const data = await res.json() as { items?: GoogleEventRaw[] }
  return data.items ?? []
}

/**
 * Create a new event on Google Calendar.
 */
export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: NewCalendarEvent,
): Promise<GoogleEventRaw> {
  const body = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.isAllDay
      ? { date: event.startAt.slice(0, 10) }
      : { dateTime: event.startAt },
    end: event.isAllDay
      ? { date: event.endAt.slice(0, 10) }
      : { dateTime: event.endAt },
  }

  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar create event failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<GoogleEventRaw>
}
