import Link from 'next/link'
import {
  Mic,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Building2,
  User,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { Footer } from '@/components/shared/Footer'

const features = [
  {
    icon: Mic,
    title: '음성 캡처',
    description:
      '말하는 것만으로 할 일이 등록됩니다. AI가 자동으로 제목, 마감일, 우선순위를 분석합니다.',
    badge: '핵심 기능',
    accent: 'bg-primary/10 text-primary',
    colSpan: 'md:col-span-2',
  },
  {
    icon: Sparkles,
    title: '스마트 브리핑',
    description:
      '매일 아침 오늘의 업무를 요약해 드립니다. 무엇부터 시작해야 할지 바로 알 수 있습니다.',
    badge: '자동화',
    accent: 'bg-amber-500/10 text-amber-600',
    colSpan: '',
  },
  {
    icon: CheckCircle2,
    title: '완료 검토',
    description:
      '저녁마다 오늘 완료한 일을 되돌아보세요. 진행하지 못한 일은 자동으로 다음 날로 이월됩니다.',
    badge: '루틴',
    accent: 'bg-green-500/10 text-green-600',
    colSpan: '',
  },
  {
    icon: BarChart3,
    title: '업무 인사이트',
    description:
      '나의 업무 패턴을 분석하여 최적의 집중 시간과 생산성 트렌드를 알려드립니다.',
    badge: 'Pro',
    accent: 'bg-violet-500/10 text-violet-600',
    colSpan: 'md:col-span-2',
  },
]

const plans = [
  {
    icon: User,
    name: 'Personal',
    label: '무료',
    description: '개인용 기본 음성 일정 관리',
    price: null,
    priceLabel: '₩0',
    priceSuffix: '/ 월',
    features: [
      '월 60분 음성 캡처',
      '할 일 자동 생성',
      '기본 태스크 관리',
      '월 50회 AI 분석',
    ],
    cta: '무료로 시작',
    highlighted: false,
  },
  {
    icon: Zap,
    name: 'Professional',
    label: '인기',
    description: '무제한 음성 요약, 인사이트, 캘린더 연동',
    price: 19900,
    priceLabel: '₩19,900',
    priceSuffix: '/ 월',
    features: [
      '무제한 음성 캡처',
      'AI 데일리 브리핑',
      '스마트 체크인',
      '생산성 인사이트',
      '캘린더 연동',
      '에이전트 커스터마이징',
    ],
    cta: '시작하기',
    highlighted: true,
  },
  {
    icon: Building2,
    name: 'Enterprise',
    label: '문의',
    description: '데이터 격리, 온프레미스 연동, 전담 지원',
    price: null,
    priceLabel: '별도 문의',
    priceSuffix: '',
    features: [
      'Professional 모든 기능',
      '데이터 격리',
      '온프레미스 연동',
      '전담 지원',
      '무제한 스토리지',
      'SLA 보장',
    ],
    cta: '문의하기',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              V
            </div>
            <span className="font-bold tracking-tight">{siteConfig.name}</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/features"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden md:inline-flex text-muted-foreground')}
            >
              기능
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden md:inline-flex text-muted-foreground')}
            >
              가격
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/20 pointer-events-none" />
          <div className="relative mx-auto max-w-5xl px-4 py-24 md:py-36 text-center">
            <Badge variant="outline" className="mb-8 text-xs gap-1.5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              음성 기반 업무 관리의 새로운 기준
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-7">
              말하는 대로{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
                이루어지는
              </span>
              <br />
              업무의 흐름
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground mb-12 leading-relaxed">
              {siteConfig.name}은 음성으로 할 일을 등록하고, AI가 자동으로 분석·정리하여
              스마트한 업무 흐름을 만들어 드립니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto px-8 gap-2')}
              >
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'w-full sm:w-auto px-8'
                )}
              >
                데모 보기
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="mx-auto max-w-5xl px-4 pb-24 md:pb-32">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              생산성을 높이는 모든 기능
            </h2>
            <p className="text-muted-foreground text-base">
              음성 한 마디로 시작하는 스마트 업무 관리
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className={cn(
                    'group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-2',
                    feature.colSpan
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl',
                          feature.accent
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-muted/30 border-y">
          <div className="mx-auto max-w-5xl px-4 py-24 md:py-32">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                합리적인 가격
              </h2>
              <p className="text-muted-foreground text-base">
                필요에 맞는 플랜을 선택하세요. 언제든지 변경할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <Card
                    key={plan.name}
                    className={cn(
                      'relative flex flex-col',
                      plan.highlighted && 'ring-2 ring-primary shadow-xl'
                    )}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="px-3 py-1 text-xs shadow-sm">인기 플랜</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{plan.priceLabel}</span>
                        {plan.priceSuffix && (
                          <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                        )}
                      </div>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan.price === null && plan.name === 'Enterprise' ? '/contact' : '/signup'}
                        className={cn(
                          buttonVariants({
                            variant: plan.highlighted ? 'default' : 'outline',
                          }),
                          'w-full mt-2'
                        )}
                      >
                        {plan.cta}
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-5xl px-4 py-24 md:py-32 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 md:py-20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-4">
                지금 바로 시작해 보세요
              </h2>
              <p className="text-primary-foreground/75 mb-10 text-base max-w-sm mx-auto">
                무료 플랜으로 시작하고, 필요할 때 업그레이드하세요.
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
      </main>

      <Footer />
    </div>
  )
}
