import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Subscribe first.' },
        { status: 400 },
      )
    }

    const body = await request.json() as { returnUrl?: string }
    const returnUrl = body.returnUrl ?? `${request.nextUrl.origin}/settings/billing`

    const url = await createCustomerPortalSession(profile.stripe_customer_id, returnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/billing/portal]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
