'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, CreditCard, Loader2, ExternalLink, Zap, Building2, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { tiers } from '@/config/tiers'
import type { TierName, TierConfig } from '@/config/tiers'
import type { Subscription } from '@/types/billing'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
}

function tierIcon(tier: TierName) {
  if (tier === 'enterprise') return <Building2 className="h-5 w-5" />
  if (tier === 'professional') return <Zap className="h-5 w-5" />
  return <User className="h-5 w-5" />
}

const FEATURE_LABELS: Record<keyof TierConfig['features'], string> = {
  voiceCapture: '음성 캡처',
  intentExtraction: '의도 추출 AI',
  taskManagement: '할일 관리',
  dailyBriefing: '일일 브리핑',
  proactiveCheckin: '능동형 체크인',
  insights: '인사이트 분석',
  calendarIntegration: '캘린더 연동',
  agentCustomization: '에이전트 커스터마이징',
  dataIsolation: '데이터 격리',
  prioritySupport: '전담 지원',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  canceled: '취소됨',
  past_due: '결제 미납',
  trialing: '체험 중',
  paused: '일시 정지',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [currentTier, setCurrentTier] = useState<TierName>('personal')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status')
      if (!res.ok) return
      const data = await res.json() as { tier: TierName; subscription: Subscription | null }
      setCurrentTier(data.tier)
      setSubscription(data.subscription)
    } catch (err) {
      console.error('[BillingPage] fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleUpgrade = async (tier: TierName) => {
    const priceKey = interval === 'monthly'
      ? `NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY`
      : `NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_YEARLY`

    const priceId =
      interval === 'monthly'
        ? process.env[`NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_MONTHLY`]
        : process.env[`NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_YEARLY`]

    if (!priceId) {
      // Enterprise: redirect to contact
      window.location.href = 'mailto:recollect@hawoolab.app?subject=VoxCierge Enterprise 플랜 문의'
      return
    }

    setLoadingPriceId(priceId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, returnUrl: window.location.href }),
      })
      if (!res.ok) throw new Error('checkout failed')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err) {
      console.error('[BillingPage] checkout error:', err)
      toast.error('결제 페이지를 열 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoadingPriceId(null)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      })
      if (!res.ok) throw new Error('portal failed')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err) {
      console.error('[BillingPage] portal error:', err)
      toast.error('구독 관리 페이지를 열 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentTierConfig = tiers[currentTier]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">구독 관리</h1>
        <p className="text-muted-foreground mt-1">플랜을 확인하고 업그레이드하세요</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            현재 플랜
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {tierIcon(currentTier)}
              </div>
              <div>
                <p className="font-semibold">{currentTierConfig.label}</p>
                <p className="text-sm text-muted-foreground">{currentTierConfig.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={currentTier === 'personal' ? 'secondary' : 'default'}>
                {currentTier === 'personal' ? '무료' : currentTierConfig.label}
              </Badge>
              {subscription && (
                <Badge
                  variant={subscription.status === 'active' ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </Badge>
              )}
            </div>
          </div>

          {subscription && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {subscription.currentPeriodStart && (
                  <div>
                    <p className="text-muted-foreground">현재 구독 시작</p>
                    <p className="font-medium">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-muted-foreground">다음 갱신일</p>
                    <p className="font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  구독이 다음 갱신일에 취소될 예정입니다.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleManageSubscription()}
                disabled={isLoadingPortal}
                className="w-full sm:w-auto"
              >
                {isLoadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                구독 관리 (Stripe)
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing interval toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={interval === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInterval('monthly')}
        >
          월간 결제
        </Button>
        <Button
          variant={interval === 'yearly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInterval('yearly')}
        >
          연간 결제
          <Badge variant="secondary" className="ml-2 text-xs">2개월 무료</Badge>
        </Button>
      </div>

      {/* Tier comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(tiers) as TierName[]).map((tier) => {
          const config = tiers[tier]
          const isCurrentTier = tier === currentTier
          const price = config.price
            ? interval === 'monthly'
              ? config.price.monthly
              : config.price.yearly
            : null

          return (
            <Card
              key={tier}
              className={`relative flex flex-col ${
                tier === 'professional' ? 'border-primary ring-1 ring-primary' : ''
              } ${isCurrentTier ? 'opacity-90' : ''}`}
            >
              {tier === 'professional' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs px-3">추천</Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {tierIcon(tier)}
                  <CardTitle className="text-base">{config.label}</CardTitle>
                </div>
                <CardDescription className="text-xs">{config.description}</CardDescription>
                <div className="mt-2">
                  {price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{formatKRW(price)}</span>
                      <span className="text-xs text-muted-foreground">
                        / {interval === 'monthly' ? '월' : '년'}
                      </span>
                    </div>
                  ) : tier === 'personal' ? (
                    <span className="text-2xl font-bold">무료</span>
                  ) : (
                    <span className="text-lg font-semibold">별도 문의</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                <ul className="space-y-2">
                  {(Object.keys(config.features) as Array<keyof TierConfig['features']>).map(
                    (feature) => (
                      <li
                        key={feature}
                        className={`flex items-center gap-2 text-sm ${
                          config.features[feature] ? '' : 'text-muted-foreground line-through'
                        }`}
                      >
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 ${
                            config.features[feature] ? 'text-green-500' : 'text-muted-foreground/30'
                          }`}
                        />
                        {FEATURE_LABELS[feature]}
                      </li>
                    ),
                  )}
                </ul>

                <div className="mt-auto">
                  {isCurrentTier ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      현재 플랜
                    </Button>
                  ) : tier === 'personal' ? (
                    <Button variant="outline" size="sm" className="w-full" disabled={!subscription}>
                      다운그레이드
                    </Button>
                  ) : tier === 'enterprise' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => void handleUpgrade(tier)}
                    >
                      영업팀 문의
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => void handleUpgrade(tier)}
                      disabled={loadingPriceId !== null}
                    >
                      {loadingPriceId !== null ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      업그레이드
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        구독은 언제든지 취소할 수 있습니다. 취소 시 현재 결제 주기 종료 후 무료 플랜으로 전환됩니다.
      </p>
    </div>
  )
}
