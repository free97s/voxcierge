import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { priceId?: string; returnUrl?: string }
    const { priceId, returnUrl } = body

    if (!priceId || !returnUrl) {
      return NextResponse.json(
        { error: 'priceId and returnUrl are required' },
        { status: 400 },
      )
    }

    const url = await createCheckoutSession(user.id, priceId, returnUrl)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/billing/checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
