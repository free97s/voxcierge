'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { tiers, hasFeature } from '@/config/tiers'
import type { TierName, TierConfig } from '@/config/tiers'

interface UseTierReturn {
  tier: TierName
  tierConfig: TierConfig
  isLoading: boolean
  hasFeature: (feature: keyof TierConfig['features']) => boolean
}

const DEFAULT_TIER: TierName = 'personal'

export function useTier(): UseTierReturn {
  const [tier, setTier] = useState<TierName>(DEFAULT_TIER)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTier = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setTier(DEFAULT_TIER)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle()

      const userTier = (profile?.tier as TierName | undefined) ?? DEFAULT_TIER
      setTier(userTier in tiers ? userTier : DEFAULT_TIER)
    } catch (err) {
      console.error('[useTier] Failed to fetch tier:', err)
      setTier(DEFAULT_TIER)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTier()
  }, [fetchTier])

  return {
    tier,
    tierConfig: tiers[tier],
    isLoading,
    hasFeature: (feature) => hasFeature(tier, feature),
  }
}
