/**
 * GET /api/calendar/connect?provider=google|outlook
 *
 * Redirects the authenticated user to the appropriate OAuth2 provider.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/calendar/google'
import { getOutlookAuthUrl } from '@/lib/calendar/outlook'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (provider !== 'google' && provider !== 'outlook') {
      return NextResponse.json(
        { error: 'Invalid provider. Use "google" or "outlook".' },
        { status: 400 },
      )
    }

    let authUrl: string

    if (provider === 'google') {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Google OAuth is not configured on this server.' },
          { status: 503 },
        )
      }
      authUrl = getGoogleAuthUrl(user.id)
    } else {
      if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Outlook OAuth is not configured on this server.' },
          { status: 503 },
        )
      }
      authUrl = getOutlookAuthUrl(user.id)
    }

    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('GET /api/calendar/connect error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
