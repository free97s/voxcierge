/**
 * GET /api/calendar/callback
 *
 * OAuth2 callback handler for both Google and Outlook.
 * State format: "<provider>:<userId>"
 *
 * On success: redirects to /settings
 * On failure: redirects to /settings?error=<reason>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptTextToBase64 } from '@/lib/encryption/server'
import { exchangeGoogleCode } from '@/lib/calendar/google'
import { exchangeOutlookCode } from '@/lib/calendar/outlook'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') ?? ''
  const oauthError = searchParams.get('error')
  const settingsUrl = `${origin}/settings`

  if (oauthError) {
    console.warn('OAuth provider returned error:', oauthError)
    return NextResponse.redirect(`${settingsUrl}?error=oauth_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${settingsUrl}?error=missing_code`)
  }

  // State: "<provider>:<userId>"
  const colonIdx = state.indexOf(':')
  if (colonIdx === -1) {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`)
  }

  const provider = state.slice(0, colonIdx) as 'google' | 'outlook'
  const userId = state.slice(colonIdx + 1)

  if (provider !== 'google' && provider !== 'outlook') {
    return NextResponse.redirect(`${settingsUrl}?error=unknown_provider`)
  }

  try {
    const supabase = await createClient()

    // Verify the current session matches the userId encoded in state
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(`${settingsUrl}?error=auth_mismatch`)
    }

    // Exchange code for tokens
    const tokens =
      provider === 'google'
        ? await exchangeGoogleCode(code)
        : await exchangeOutlookCode(code)

    // Encrypt tokens before persisting
    const encryptedAccess = encryptTextToBase64(tokens.accessToken)
    const encryptedRefresh = tokens.refreshToken
      ? encryptTextToBase64(tokens.refreshToken)
      : null

    // Upsert the connection record
    const { error: upsertErr } = await supabase
      .from('calendar_connections')
      .upsert(
        {
          user_id: user.id,
          provider,
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: tokens.expiresAt?.toISOString() ?? null,
          calendar_id: tokens.calendarId,
          email: tokens.email,
          is_active: true,
        },
        { onConflict: 'user_id,provider' },
      )

    if (upsertErr) {
      console.error('Failed to save calendar connection:', upsertErr)
      return NextResponse.redirect(`${settingsUrl}?error=db_error`)
    }

    return NextResponse.redirect(`${settingsUrl}?connected=${provider}`)
  } catch (err) {
    console.error('Calendar callback error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=internal_error`)
  }
}
