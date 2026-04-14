import Link from 'next/link'
import { Check, X, Zap, User, Building2, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { tiers } from '@/config/tiers'

const featureLabels: Record<string, string> = {
  voiceCapture: '음성 캡처',
  intentExtraction: 'AI 의도 분석',
  taskManagement: '할 일 관리',
  dailyBriefing: '데일리 브리핑',
  proactiveCheckin: '스마트 체크인',
  insights: '생산성 인사이트',
  calendarIntegration: '캘린더 연동',
  agentCustomization: '에이전트 커스터마이징',
  dataIsolation: '데이터 격리',
  prioritySupport: '전담 지원',
}

const limitLabels: Record<string, (v: number) => string> = {
  voiceMinutesPerMonth: (v) => v === Infinity ? '무제한 음성 캡처' : `월 ${v}분 음성 캡처`,
  transcriptionsPerMonth: (v) => v === Infinity ? '무제한 AI 전사' : `월 ${v}회 AI 전사`,
  aiCallsPerMonth: (v) => v === Infinity ? '무제한 AI 분석' : `월 ${v}회 AI 분석`,
  storageMb: (v) => v === Infinity ? '무제한 저장공간' : v >= 1024 ? `${v / 1024}GB 저장공간` : `${v}MB 저장공간`,
}

const planIcons = { personal: User, professional: Zap, enterprise: Building2 }

const planHighlighted = { personal: false, professional: true, enterprise: false }

const planCta = {
  personal: { label: '무료로 시작', href: '/signup' },
  professional: { label: '시작하기', href: '/signup' },
  enterprise: { label: '문의하기', href: '/contact' },
}

const faqs = [
  {
    q: '플랜은 언제든지 변경할 수 있나요?',
    a: '네, 언제든지 업그레이드 또는 다운그레이드할 수 있습니다. 변경 사항은 다음 결제 주기부터 적용되며, 업그레이드 시에는 즉시 새로운 기능을 사용할 수 있습니다.',
  },
  {
    q: '결제 방법은 어떤 것을 지원하나요?',
    a: '신용카드, 체크카드(Visa, Mastercard, American Express)를 지원합니다. 결제는 Stripe를 통해 안전하게 처리됩니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '결제 후 7일 이내에 요청하시면 전액 환불해 드립니다. 7일 이후에는 환불이 어려우나, 남은 기간에 대한 크레딧으로 전환해 드립니다.',
  },
  {
    q: '무료 플랜에서 유료 플랜으로 전환하면 기존 데이터는 어떻게 되나요?',
    a: '기존에 저장된 모든 데이터(할 일, 음성 기록, 일기 등)는 그대로 유지됩니다. 플랜 변경 시 데이터 손실은 없습니다.',
  },
  {
    q: 'Enterprise 플랜은 어떻게 시작하나요?',
    a: '문의하기 페이지를 통해 팀 규모와 요구 사항을 알려주시면, 영업일 기준 1~2일 내에 맞춤형 견적서와 함께 연락 드립니다.',
  },
]

export default function PricingPage() {
  const tierList = ['personal', 'professional', 'enterprise'] as const

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            합리적인 가격
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            나에게 맞는{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              플랜 선택
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
            무료로 시작하고, 필요할 때 언제든지 업그레이드하세요. 약정 없이 월 단위로 이용 가능합니다.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tierList.map((tierKey) => {
            const tier = tiers[tierKey]
            const Icon = planIcons[tierKey]
            const highlighted = planHighlighted[tierKey]
            const cta = planCta[tierKey]
            const price = tier.price

            return (
              <Card
                key={tierKey}
                className={cn(
                  'relative flex flex-col',
                  highlighted && 'ring-2 ring-primary shadow-xl'
                )}
              >
                {highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 text-xs shadow-sm">인기 플랜</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{tier.label}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    {price ? (
                      <>
                        <span className="text-3xl font-bold">₩{price.monthly.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">/ 월</span>
                      </>
                    ) : tierKey === 'personal' ? (
                      <span className="text-3xl font-bold">₩0</span>
                    ) : (
                      <span className="text-2xl font-bold">별도 문의</span>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  {/* Limits */}
                  <ul className="space-y-2">
                    {(Object.keys(limitLabels) as (keyof typeof limitLabels)[]).map((key) => {
                      const val = tier.limits[key as keyof typeof tier.limits]
                      if (val === undefined) return null
                      return (
                        <li key={key} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{limitLabels[key](val)}</span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Features */}
                  <div className="border-t pt-3">
                    <ul className="space-y-2">
                      {(Object.keys(tier.features) as (keyof typeof tier.features)[]).map((f) => {
                        const enabled = tier.features[f]
                        return (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            {enabled ? (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={cn(!enabled && 'text-muted-foreground')}>
                              {featureLabels[f] ?? f}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <Link
                    href={cta.href}
                    className={cn(
                      buttonVariants({ variant: highlighted ? 'default' : 'outline' }),
                      'w-full mt-auto'
                    )}
                  >
                    {cta.label}
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 border-t">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">자주 묻는 질문</h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center w-full">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70 pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              지금 바로 무료로 시작하세요
            </h2>
            <p className="text-primary-foreground/75 mb-8 max-w-sm mx-auto">
              신용카드 없이, 약정 없이 바로 시작할 수 있습니다.
            </p>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 px-8'
              )}
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
