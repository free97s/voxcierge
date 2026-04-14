import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function getStripe() {
  return getStripeClient()
}

/**
 * Create a Stripe Checkout Session for a subscription upgrade.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  returnUrl: string,
): Promise<string> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .maybeSingle()

  const customerId = profile?.stripe_customer_id
    ? profile.stripe_customer_id
    : await getOrCreateCustomer(userId, profile?.email ?? '', profile?.full_name ?? undefined)

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?success=1`,
    cancel_url: `${returnUrl}?canceled=1`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'ko',
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return session.url
}

/**
 * Create a Stripe Customer Portal session so the user can manage their subscription.
 * Returns the session URL.
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * Get an existing Stripe customer by userId metadata, or create a new one.
 * Persists the customer ID to the profiles table.
 * Returns the Stripe customer ID.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string,
): Promise<string> {
  const supabase = await createClient()

  // Check if we already have a customer ID stored
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  // Search Stripe for an existing customer with this userId metadata
  const existing = await getStripe().customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  if (existing.data.length > 0) {
    const customerId = existing.data[0].id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
    return customerId
  }

  // Create a new Stripe customer
  const customer = await getStripe().customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  })

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}
