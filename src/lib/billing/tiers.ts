import type { SupabaseClient } from '@supabase/supabase-js'
import { tiers } from '@/config/tiers'
import type { TierName } from '@/config/tiers'

/**
 * Map of Stripe price IDs to tier names.
 * Populate these from your Stripe dashboard / environment variables.
 */
const PRICE_ID_TO_TIER: Record<string, TierName> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '']: 'professional',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_YEARLY ?? '']: 'professional',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '']: 'enterprise',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY ?? '']: 'enterprise',
}

const TIER_PRICE_IDS: Record<TierName, { monthly: string; yearly: string }> = {
  personal: { monthly: '', yearly: '' },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_YEARLY ?? '',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY ?? '',
  },
}

/**
 * Resolve a Stripe price ID to a tier name.
 * Falls back to 'personal' for unknown price IDs.
 */
export function getTierFromPriceId(priceId: string): TierName {
  return PRICE_ID_TO_TIER[priceId] ?? 'personal'
}

/**
 * Get the Stripe price ID for a given tier and billing interval.
 * Returns an empty string for tiers without a Stripe price (personal, enterprise contact).
 */
export function getPriceId(tier: TierName, interval: 'monthly' | 'yearly'): string {
  return TIER_PRICE_IDS[tier][interval]
}

/**
 * Fetch the current tier for a user from the profiles table.
 * Falls back to 'personal' if no profile record exists.
 */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<TierName> {
  const { data, error } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[billing/tiers] getUserTier error:', error.message)
    return 'personal'
  }

  const tier = data?.tier as TierName | undefined
  return tier && tier in tiers ? tier : 'personal'
}

/**
 * Update the tier stored on a user's profile.
 */
export async function updateUserTier(
  supabase: SupabaseClient,
  userId: string,
  tier: TierName,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[billing/tiers] updateUserTier error:', error.message)
    throw new Error(`Failed to update user tier: ${error.message}`)
  }
}
