'use client'

import { Lock, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTier } from '@/hooks/useTier'
import { tiers } from '@/config/tiers'
import type { TierName, TierConfig } from '@/config/tiers'
import { cn } from '@/lib/utils'

const TIER_ORDER: TierName[] = ['personal', 'professional', 'enterprise']

function tierRank(tier: TierName): number {
  return TIER_ORDER.indexOf(tier)
}

const TIER_LABELS: Record<TierName, string> = {
  personal: 'Personal',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

interface TierGateProps {
  requiredTier: TierName
  featureName: string
  children: React.ReactNode
  className?: string
}

export function TierGate({
  requiredTier,
  featureName,
  children,
  className,
}: TierGateProps) {
  const { tier, isLoading } = useTier()

  // While loading, render a skeleton placeholder
  if (isLoading) {
    return (
      <div className={cn('animate-pulse rounded-xl bg-muted h-32', className)} />
    )
  }

  const hasAccess = tierRank(tier) >= tierRank(requiredTier)
  if (hasAccess) {
    return <>{children}</>
  }

  const requiredConfig: TierConfig = tiers[requiredTier]
  const tierPrice = requiredConfig.price
    ? `월 ${requiredConfig.price.monthly.toLocaleString('ko-KR')}원`
    : '별도 문의'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center dark:border-amber-900 dark:bg-amber-950/30',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <p className="font-semibold text-foreground">{featureName}</p>
          <Badge className="bg-amber-500 text-white border-0 hover:bg-amber-600">
            {TIER_LABELS[requiredTier]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          이 기능은 {TIER_LABELS[requiredTier]} 구독에서 사용할 수 있습니다.
        </p>
        <p className="text-xs text-muted-foreground">{tierPrice}부터 시작</p>
      </div>

      <Button
        size="sm"
        className="gap-2"
        render={<Link href="/settings?tab=billing" />}
      >
        <ArrowUpCircle className="h-4 w-4" />
        지금 업그레이드
      </Button>
    </div>
  )
}
