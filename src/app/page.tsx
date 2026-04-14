import Link from 'next/link'
import { Mic, Sparkles, CheckCircle2, BarChart3, ArrowRight } from 'lucide-react'
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

const features = [
  {
    icon: Mic,
    title: '음성 캡처',
    description:
      '말하는 것만으로 할 일이 등록됩니다. AI가 자동으로 제목, 마감일, 우선순위를 분석합니다.',
    badge: '핵심 기능',
  },
  {
    icon: Sparkles,
    title: '스마트 브리핑',
    description:
      '매일 아침 오늘의 업무를 요약해 드립니다. 무엇부터 시작해야 할지 바로 알 수 있습니다.',
    badge: '자동화',
  },
  {
    icon: CheckCircle2,
    title: '완료 검토',
    description:
      '저녁마다 오늘 완료한 일을 되돌아보세요. 진행하지 못한 일은 자동으로 다음 날로 이월됩니다.',
    badge: '루틴',
  },
  {
    icon: BarChart3,
    title: '업무 인사이트',
    description:
      '나의 업무 패턴을 분석하여 최적의 집중 시간과 생산성 트렌드를 알려드립니다.',
    badge: 'Pro',
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
        <section className="mx-auto max-w-5xl px-4 py-20 md:py-32 text-center">
          <Badge variant="secondary" className="mb-6 text-xs">
            음성 기반 업무 관리의 새로운 기준
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            말하는 대로{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              이루어지는
            </span>
            <br />
            업무의 흐름
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
            {siteConfig.name}은 음성으로 할 일을 등록하고, AI가 자동으로 분석·정리하여
            <br className="hidden sm:block" />
            스마트한 업무 흐름을 만들어 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto px-8')}
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto px-8')}
            >
              로그인
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-5xl px-4 pb-20 md:pb-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              생산성을 높이는 모든 기능
            </h2>
            <p className="text-muted-foreground">
              음성 한 마디로 시작하는 스마트 업무 관리
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge
                        variant={feature.badge === 'Pro' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{feature.title}</CardTitle>
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

        {/* CTA band */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              지금 바로 시작해 보세요
            </h2>
            <p className="text-muted-foreground mb-8">
              무료 플랜으로 시작하고, 필요할 때 업그레이드하세요.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px]">
              V
            </div>
            <span className="font-medium">{siteConfig.name}</span>
          </div>
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
