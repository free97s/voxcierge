import Link from 'next/link'
import {
  Mic,
  Sparkles,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Mic,
    title: '음성 캡처 & AI 의도 분석',
    badge: '핵심 기능',
    description:
      '말하는 것만으로 할 일이 자동으로 생성됩니다. AI가 음성을 분석하여 제목, 마감일, 우선순위, 카테고리를 자동으로 추출합니다. 복잡한 입력 없이 자연스럽게 말하면 됩니다.',
    accent: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary bg-primary/10',
  },
  {
    icon: Sparkles,
    title: 'AI 데일리 브리핑',
    badge: '자동화',
    description:
      '매일 아침 AI가 오늘 해야 할 일들을 요약해 알려줍니다. 우선순위에 따라 정렬된 할 일 목록과 함께 오늘의 집중 포인트를 제안합니다. TTS 기능으로 음성으로도 들을 수 있습니다.',
    accent: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-600 bg-amber-500/10',
  },
  {
    icon: CheckCircle2,
    title: '스마트 체크인',
    badge: '루틴',
    description:
      '기한이 지난 할 일에 대해 AI가 직접 물어봅니다. 완료했는지, 연기할지, 취소할지 피드백을 주면 AI가 일정을 재조정합니다. 미루는 습관을 줄이고 책임감 있는 업무 관리를 도와줍니다.',
    accent: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-600 bg-green-500/10',
  },
  {
    icon: BarChart3,
    title: '생산성 인사이트',
    badge: 'Pro',
    description:
      'AI가 나의 업무 패턴을 분석하여 최적의 집중 시간대, 완료율 트렌드, 반복되는 패턴을 시각화합니다. 데이터 기반으로 나에게 맞는 업무 리듬을 찾을 수 있습니다.',
    accent: 'from-violet-500/20 to-violet-500/5',
    iconColor: 'text-violet-600 bg-violet-500/10',
  },
  {
    icon: BookOpen,
    title: '소설 일기장',
    badge: 'Pro',
    description:
      'AI가 하루 동안 완료한 할 일들을 바탕으로 소설처럼 하루를 정리해 줍니다. 건조한 업무 기록이 아닌, 읽기 좋은 내러티브로 하루를 돌아볼 수 있습니다.',
    accent: 'from-rose-500/20 to-rose-500/5',
    iconColor: 'text-rose-600 bg-rose-500/10',
  },
  {
    icon: Calendar,
    title: '캘린더 연동',
    badge: 'Pro',
    description:
      'Google Calendar, Outlook과 양방향 연동됩니다. 기존 일정과 할 일 간 충돌을 자동으로 감지하고, 빈 시간에 할 일을 자동으로 배치하는 스마트 스케줄링을 제공합니다.',
    accent: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-600 bg-blue-500/10',
  },
]

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            모든 기능 살펴보기
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            일하는 방식을{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              완전히 바꾸는
            </span>
            <br />
            6가지 핵심 기능
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
            음성 한 마디로 시작해서, AI가 나머지를 처리합니다.
            VoxCierge의 핵심 기능들을 자세히 알아보세요.
          </p>
        </div>
      </section>

      {/* Features Detail */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24 w-full">
        <div className="flex flex-col gap-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0
            return (
              <div
                key={feature.title}
                className={cn(
                  'grid grid-cols-1 md:grid-cols-2 gap-10 items-center',
                  !isEven && 'md:[&>*:first-child]:order-2'
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', feature.iconColor)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{feature.title}</h2>
                  <p className="text-muted-foreground leading-relaxed text-base">{feature.description}</p>
                </div>
                <div className={cn(
                  'rounded-2xl bg-gradient-to-br p-8 flex items-center justify-center min-h-[220px]',
                  feature.accent
                )}>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl', feature.iconColor)}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">스크린샷 준비 중</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">지금 바로 경험해 보세요</h2>
          <p className="text-muted-foreground mb-8">무료 플랜으로 시작하고, 필요할 때 업그레이드하세요.</p>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 px-8')}>
            무료로 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
