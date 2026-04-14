import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TierName } from '@/config/tiers'
import type { Subscription } from '@/types/billing'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('tier').eq('id', user.id).maybeSingle(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const tier: TierName = (profile?.tier as TierName | undefined) ?? 'personal'

    let subscription: Subscription | null = null
    if (sub) {
      subscription = {
        id: sub.id,
        userId: sub.user_id,
        tier: sub.tier,
        stripeSubscriptionId: sub.stripe_subscription_id ?? undefined,
        stripePriceId: sub.stripe_price_id ?? undefined,
        status: sub.status,
        currentPeriodStart: sub.current_period_start ?? undefined,
        currentPeriodEnd: sub.current_period_end ?? undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      }
    }

    return NextResponse.json({ tier, subscription })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/billing/status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
