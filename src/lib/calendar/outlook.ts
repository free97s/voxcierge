/**
 * Microsoft Outlook Calendar integration via Microsoft Graph API.
 *
 * Required env vars:
 *   AZURE_CLIENT_ID
 *   AZURE_CLIENT_SECRET
 *   NEXT_PUBLIC_APP_URL   — base URL for the OAuth redirect URI
 */

import type { NewCalendarEvent, OAuthTokens, OutlookEventRaw } from './types'

const AZURE_AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

const SCOPES = [
  'offline_access',
  'Calendars.ReadWrite',
  'User.Read',
].join(' ')

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/api/calendar/callback`
}

function requireEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.AZURE_CLIENT_ID
  const clientSecret = process.env.AZURE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('AZURE_CLIENT_ID and AZURE_CLIENT_SECRET must be set')
  }
  return { clientId, clientSecret }
}

/**
 * Build the Microsoft OAuth2 authorization URL.
 * @param userId  Passed as `state` to verify on callback.
 */
export function getOutlookAuthUrl(userId: string): string {
  const { clientId } = requireEnv()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state: `outlook:${userId}`,
  })
  return `${AZURE_AUTH_BASE}/authorize?${params.toString()}`
}

/**
 * Exchange the authorization code for access + refresh tokens.
 */
export async function exchangeOutlookCode(code: string): Promise<OAuthTokens> {
  const { clientId, clientSecret } = requireEnv()

  const res = await fetch(`${AZURE_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
      scope: SCOPES,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook token exchange failed: ${err}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : null

  const userInfo = await fetchOutlookUserInfo(data.access_token)

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt,
    email: userInfo.email,
    calendarId: null, // Graph API uses /me/calendar by default
  }
}

/**
 * Refresh an expired Outlook access token using the stored refresh token.
 */
export async function refreshOutlookToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const { clientId, clientSecret } = requireEnv()

  const res = await fetch(`${AZURE_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      scope: SCOPES,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook token refresh failed: ${err}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

async function fetchOutlookUserInfo(accessToken: string): Promise<{ email: string | null }> {
  try {
    const res = await fetch(`${GRAPH_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return { email: null }
    const data = await res.json() as { mail?: string; userPrincipalName?: string }
    return { email: data.mail ?? data.userPrincipalName ?? null }
  } catch {
    return { email: null }
  }
}

/**
 * Fetch Outlook Calendar events between timeMin and timeMax.
 * Uses Graph API calendarView for proper recurring event expansion.
 */
export async function fetchOutlookEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<OutlookEventRaw[]> {
  const params = new URLSearchParams({
    startDateTime: timeMin.toISOString(),
    endDateTime: timeMax.toISOString(),
    $top: '250',
    $select: 'id,subject,body,start,end,location,isAllDay,showAs',
    $orderby: 'start/dateTime',
  })

  const url = `${GRAPH_BASE}/me/calendarView?${params}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook Calendar fetch failed (${res.status}): ${err}`)
  }

  const data = await res.json() as { value?: OutlookEventRaw[] }
  return data.value ?? []
}

/**
 * Create a new event on Outlook Calendar.
 */
export async function createOutlookEvent(
  accessToken: string,
  event: NewCalendarEvent,
): Promise<OutlookEventRaw> {
  const body = {
    subject: event.title,
    body: event.description
      ? { contentType: 'text', content: event.description }
      : undefined,
    start: { dateTime: event.startAt, timeZone: 'UTC' },
    end: { dateTime: event.endAt, timeZone: 'UTC' },
    location: event.location
      ? { displayName: event.location }
      : undefined,
    isAllDay: event.isAllDay ?? false,
  }

  const res = await fetch(`${GRAPH_BASE}/me/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook Calendar create event failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<OutlookEventRaw>
}
