import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'
import { getTierFromPriceId, updateUserTier } from '@/lib/billing/tiers'
import type { SubscriptionStatus } from '@/types/billing'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Map Stripe subscription status strings to our internal SubscriptionStatus type.
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    paused: 'paused',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  }
  return map[status] ?? 'canceled'
}

/**
 * In Stripe API v2026-03-25, current_period_start/end moved to
 * subscription.items.data[0].current_period_start/end.
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  }
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Read the raw body bytes for signature verification
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/webhook] Signature verification failed:', message)
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabase, invoice)
        break
      }

      default:
        // Unhandled event type — acknowledge receipt without processing
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[stripe/webhook] Handler error for ${event.type}:`, message)
    return NextResponse.json({ error: 'Handler failed', detail: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== 'subscription' || !session.subscription) return

  const userId = session.metadata?.userId
  if (!userId) {
    console.warn('[stripe/webhook] checkout.session.completed missing userId metadata')
    return
  }

  // Retrieve the full subscription object
  const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const tier = getTierFromPriceId(priceId)
  const status = mapStripeStatus(subscription.status)
  const { current_period_start, current_period_end } = getSubscriptionPeriod(subscription)

  // Upsert subscription record
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  // Update the profile tier
  await updateUserTier(supabase, userId, tier)

  // Store customer ID if not already present
  if (session.customer) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId)
  }
}

async function handleSubscriptionUpdated(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    // Try to look up by stripe_subscription_id
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()
    if (!data?.user_id) {
      console.warn('[stripe/webhook] subscription.updated: cannot resolve userId for', subscription.id)
      return
    }
    return handleSubscriptionUpdatedForUser(supabase, subscription, data.user_id)
  }
  return handleSubscriptionUpdatedForUser(supabase, subscription, userId)
}

async function handleSubscriptionUpdatedForUser(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  userId: string,
) {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const tier = getTierFromPriceId(priceId)
  const status = mapStripeStatus(subscription.status)
  const { current_period_start, current_period_end } = getSubscriptionPeriod(subscription)

  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  // Only update tier for active/trialing subscriptions
  if (status === 'active' || status === 'trialing') {
    await updateUserTier(supabase, userId, tier)
  } else if (status === 'canceled' || status === 'past_due') {
    await updateUserTier(supabase, userId, 'personal')
  }
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!data?.user_id) {
    console.warn('[stripe/webhook] subscription.deleted: no matching record for', subscription.id)
    return
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      tier: 'personal',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  await updateUserTier(supabase, data.user_id, 'personal')
}

async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice,
) {
  // In Stripe v2026-03-25, the subscription ID lives on invoice.parent.subscription_details.subscription
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? (invoice.parent.subscription_details?.subscription as string | null | undefined)
      : null

  if (!subscriptionId) return

  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!data?.user_id) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
}
