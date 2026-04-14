import Link from 'next/link'
import {
  UserPlus,
  Mic,
  CheckSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: '회원가입',
    description:
      '이메일 주소로 간편하게 회원가입합니다. 별도의 신용카드 입력 없이 무료 플랜으로 바로 시작할 수 있습니다. 소셜 로그인(Google)도 지원합니다.',
    tip: '회원가입 후 이메일 인증을 완료하면 바로 사용할 수 있습니다.',
    color: 'bg-primary/10 text-primary',
  },
  {
    step: 2,
    icon: Mic,
    title: '첫 음성 녹음하기',
    description:
      '대시보드에서 마이크 버튼을 누르고 할 일을 말하면 됩니다. "내일까지 보고서 작성해야 해", "이번 주 금요일 팀 미팅 준비" 처럼 자연스럽게 말하면 AI가 자동으로 분석합니다.',
    tip: '조용한 환경에서 마이크에 가까이 대고 말하면 인식률이 높아집니다.',
    color: 'bg-violet-500/10 text-violet-600',
  },
  {
    step: 3,
    icon: CheckSquare,
    title: '할 일 관리하기',
    description:
      'AI가 생성한 할 일을 확인하고, 필요하면 수정합니다. 우선순위, 마감일, 카테고리를 조정하고 할 일 목록을 관리합니다. 완료한 항목은 체크하면 됩니다.',
    tip: '할 일을 탭하면 세부 정보를 확인하고 편집할 수 있습니다.',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    step: 4,
    icon: Sparkles,
    title: '브리핑 받기',
    description:
      'Professional 플랜에서는 매일 아침 AI 브리핑을 받습니다. 오늘의 우선 할 일과 일정을 요약해서 알려주며, 음성으로도 들을 수 있습니다. 알림 설정에서 브리핑 시간을 조정하세요.',
    tip: '설정 > 알림에서 브리핑 수신 시간을 원하는 시간으로 설정할 수 있습니다.',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    step: 5,
    icon: BookOpen,
    title: '일기장 확인',
    description:
      '하루를 마치면 AI가 오늘 완료한 할 일들을 바탕으로 소설 같은 하루 일기를 작성해 줍니다. 일기장 메뉴에서 나의 하루를 돌아보고, 생산성 패턴을 확인하세요.',
    tip: '일기는 매일 자동으로 생성되며, 원하면 직접 편집할 수도 있습니다.',
    color: 'bg-rose-500/10 text-rose-600',
  },
]

const tips = [
  {
    title: '자연어로 말하세요',
    description: '"내일 오후 3시까지 기획서 제출"처럼 구체적으로 말할수록 AI가 더 정확하게 분석합니다.',
  },
  {
    title: '정기적인 체크인',
    description: 'AI 체크인 알림에 응답하면 미완료 항목을 놓치지 않고 관리할 수 있습니다.',
  },
  {
    title: '캘린더 연동 활용',
    description: 'Google Calendar와 연동하면 기존 일정과 할 일을 통합 관리할 수 있습니다.',
  },
  {
    title: '인사이트 활용',
    description: '주간 인사이트를 통해 나의 생산성 패턴을 파악하고 업무 습관을 개선하세요.',
  },
]

export default function GuidePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            시작 가이드
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            5분이면{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              시작 완료
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
            VoxCierge를 처음 사용하는 분들을 위한 단계별 안내입니다.
            따라하다 보면 어느새 AI 비서가 나의 업무를 관리하고 있을 것입니다.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24 w-full">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-border hidden sm:block" />

          <div className="flex flex-col gap-12">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="relative grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-8">
                  {/* Step indicator */}
                  <div className="flex sm:flex-col items-center gap-3 sm:gap-0">
                    <div className={cn(
                      'relative z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shrink-0',
                      step.color
                    )}>
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <span className="sm:hidden text-sm font-bold text-muted-foreground">단계 {step.step}</span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-3 pb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                        단계 {step.step}
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">{step.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                    {/* Screenshot placeholder */}
                    <div className="rounded-xl bg-muted/50 border border-dashed p-8 flex items-center justify-center min-h-[140px] mt-2">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Icon className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">스크린샷 준비 중</p>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="flex gap-2 items-start bg-muted/50 rounded-lg px-3 py-2.5 mt-1">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{step.tip}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tips & Tricks */}
      <section className="bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">팁 & 트릭</h2>
            <p className="text-muted-foreground text-sm">더 효율적으로 VoxCierge를 활용하는 방법</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <Card key={tip.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">{tip.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center w-full">
        <h2 className="text-2xl font-bold tracking-tight mb-4">준비되셨나요?</h2>
        <p className="text-muted-foreground mb-8">지금 바로 VoxCierge를 시작해 보세요.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 px-8')}>
            무료로 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/faq" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-8')}>
            FAQ 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
