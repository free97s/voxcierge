'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const categories = [
  {
    name: '일반',
    faqs: [
      {
        q: 'VoxCierge는 어떤 서비스인가요?',
        a: 'VoxCierge는 음성으로 할 일을 등록하면 AI가 자동으로 분석·정리해 주는 지능형 업무 비서 서비스입니다. 말하는 것만으로 할 일이 생성되고, AI가 데일리 브리핑, 스마트 체크인, 생산성 인사이트 등을 제공합니다.',
      },
      {
        q: '어떤 기기에서 사용할 수 있나요?',
        a: '웹 브라우저가 있는 모든 기기(PC, 스마트폰, 태블릿)에서 사용할 수 있습니다. Chrome, Safari, Edge, Firefox 최신 버전을 권장합니다. PWA(Progressive Web App)로 설치하면 앱처럼 사용할 수도 있습니다.',
      },
      {
        q: '인터넷 없이도 사용할 수 있나요?',
        a: '음성 인식과 AI 분석은 인터넷 연결이 필요합니다. 다만 PWA 설치 시 이미 저장된 할 일 목록은 오프라인에서도 확인할 수 있습니다.',
      },
      {
        q: '여러 기기에서 동시에 사용할 수 있나요?',
        a: '네, 하나의 계정으로 여러 기기에서 동시에 사용할 수 있습니다. 데이터는 클라우드에 저장되어 실시간으로 동기화됩니다.',
      },
      {
        q: '서비스를 탈퇴하면 데이터는 어떻게 되나요?',
        a: '탈퇴 요청 후 30일 이내에 모든 데이터가 완전히 삭제됩니다. 탈퇴 전 데이터 내보내기(JSON 형식) 기능을 통해 데이터를 미리 백업하실 수 있습니다.',
      },
    ],
  },
  {
    name: '음성 인식',
    faqs: [
      {
        q: '어떤 언어로 말할 수 있나요?',
        a: '현재 한국어를 기본으로 지원합니다. 영어 혼용(코드 스위칭)도 지원하며, 추후 다국어 지원을 확대할 예정입니다.',
      },
      {
        q: '음성 인식이 잘 안 될 때는 어떻게 하나요?',
        a: '조용한 환경에서 마이크에 가까이 대고 또렷하게 말씀해 주세요. 마이크 권한이 허용되어 있는지 브라우저 설정에서 확인해 주시고, Chrome 브라우저를 사용하시면 인식률이 더 높습니다.',
      },
      {
        q: '음성으로 할 일을 등록할 때 어떻게 말해야 하나요?',
        a: '"내일까지 보고서 작성", "이번 주 금요일 오후 2시 클라이언트 미팅 준비", "긴급: 버그 수정" 등 자연스럽게 말하면 됩니다. 구체적인 날짜, 시간, 우선순위를 포함하면 더 정확하게 인식됩니다.',
      },
      {
        q: '음성 데이터는 어디에 저장되나요?',
        a: '음성은 텍스트로 변환 후 AI 분석에 활용되며, 원본 음성 파일은 암호화되어 저장됩니다. 상세 내용은 개인정보처리방침을 확인해 주세요.',
      },
      {
        q: '배경 소음이 있어도 인식이 되나요?',
        a: '일반적인 사무실 환경 정도의 소음에서는 정상적으로 인식됩니다. 매우 시끄러운 환경(카페, 야외 공사장 등)에서는 인식률이 낮아질 수 있으니 조용한 곳에서 사용하시길 권장합니다.',
      },
    ],
  },
  {
    name: '결제',
    faqs: [
      {
        q: '무료 플랜에서 유료 플랜으로 언제든지 전환할 수 있나요?',
        a: '네, 언제든지 업그레이드할 수 있습니다. 업그레이드 시 즉시 모든 기능을 이용할 수 있으며, 첫 결제는 업그레이드 당일부터 적용됩니다.',
      },
      {
        q: '구독을 해지하면 어떻게 되나요?',
        a: '해지 요청 시 남은 구독 기간 동안은 계속 사용 가능합니다. 구독 만료 후에는 자동으로 무료 플랜으로 전환되며, 무료 플랜 한도를 초과한 데이터는 읽기 전용으로 유지됩니다.',
      },
      {
        q: '연간 결제 시 할인이 있나요?',
        a: '네, 연간 결제 시 월 결제 대비 약 17% 할인된 가격으로 이용하실 수 있습니다. Professional 플랜 기준 월 ₩19,900 → 연 ₩199,000(월 ₩16,583 상당)입니다.',
      },
      {
        q: '영수증이나 세금계산서를 발행받을 수 있나요?',
        a: '결제 완료 후 등록된 이메일로 영수증이 자동 발송됩니다. 세금계산서가 필요하신 경우 recollect@hawoolab.app으로 사업자 정보를 보내주시면 발행해 드립니다.',
      },
      {
        q: '결제는 얼마나 안전한가요?',
        a: '결제는 글로벌 결제 전문 기업 Stripe를 통해 처리되며, PCI DSS Level 1 인증을 받은 안전한 시스템입니다. 카드 정보는 당사 서버에 저장되지 않습니다.',
      },
    ],
  },
  {
    name: '개인정보',
    faqs: [
      {
        q: '제 음성 데이터를 AI 학습에 사용하나요?',
        a: '기본적으로 사용자의 음성 데이터는 AI 모델 학습에 사용되지 않습니다. 모든 AI 처리는 사용자 개인의 서비스 제공 목적으로만 사용됩니다.',
      },
      {
        q: '제 데이터를 제3자에게 판매하나요?',
        a: '절대 판매하지 않습니다. 사용자 데이터는 서비스 제공 목적으로만 사용되며, 법적 요구 사항이 있는 경우를 제외하고 제3자에게 제공되지 않습니다.',
      },
      {
        q: '데이터는 어느 국가에 저장되나요?',
        a: '데이터는 Supabase 클라우드 인프라를 통해 저장되며, 현재 한국 및 아시아 태평양 지역 데이터 센터를 사용합니다. 모든 데이터는 암호화된 상태로 저장됩니다.',
      },
      {
        q: '내 데이터를 내보내거나 삭제할 수 있나요?',
        a: '네, 설정 > 계정 메뉴에서 언제든지 모든 데이터를 JSON 형식으로 내보내거나, 계정 및 데이터 전체를 삭제할 수 있습니다.',
      },
      {
        q: '개인정보처리방침은 어디서 확인하나요?',
        a: '하단의 개인정보처리방침 링크 또는 /privacy 페이지에서 자세한 내용을 확인하실 수 있습니다. 방침 변경 시 이메일로 사전 안내 드립니다.',
      },
    ],
  },
  {
    name: '기술 지원',
    faqs: [
      {
        q: '로그인이 안 될 때는 어떻게 하나요?',
        a: '비밀번호 재설정 기능을 이용해 주세요. 이메일로 재설정 링크가 발송됩니다. 그래도 해결이 안 되면 recollect@hawoolab.app으로 문의해 주세요.',
      },
      {
        q: '음성 캡처 버튼이 작동하지 않아요.',
        a: '브라우저의 마이크 권한이 허용되어 있는지 확인해 주세요. 주소창 옆의 자물쇠 아이콘 클릭 > 마이크 권한 허용으로 설정할 수 있습니다. 그래도 안 된다면 Chrome 브라우저를 사용해 보세요.',
      },
      {
        q: '앱 속도가 느릴 때는 어떻게 하나요?',
        a: '브라우저 캐시를 지우고 페이지를 새로고침해 보세요. 그래도 느리다면 다른 브라우저로 시도해 보시거나, recollect@hawoolab.app으로 문의해 주세요.',
      },
      {
        q: '알림이 오지 않아요.',
        a: '브라우저의 알림 권한이 허용되어 있는지 확인해 주세요. 설정 > 알림 메뉴에서 알림 옵션을 다시 활성화해 보세요. 모바일의 경우 PWA로 설치 후 사용하면 더 안정적인 알림을 받을 수 있습니다.',
      },
      {
        q: '기능 요청이나 버그 신고는 어디서 하나요?',
        a: '문의하기 페이지를 통해 기능 요청이나 버그 신고를 해주시면 됩니다. 모든 피드백은 소중하게 검토하고 서비스 개선에 반영하겠습니다.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium hover:text-primary transition-colors"
      >
        <span>{q}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].name)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            자주 묻는 질문
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            무엇이든{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              물어보세요
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
            VoxCierge에 대해 자주 묻는 질문들을 모았습니다.
            원하는 답을 찾지 못하셨다면 문의하기를 이용해 주세요.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="mx-auto max-w-4xl px-4 py-16 w-full">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors border',
                activeCategory === cat.name
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        {categories.map((cat) =>
          cat.name === activeCategory ? (
            <div key={cat.name} className="divide-y border rounded-xl px-4">
              {cat.faqs.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          ) : null
        )}
      </section>

      {/* Contact CTA */}
      <section className="bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center w-full">
          <h2 className="text-xl font-bold tracking-tight mb-2">원하는 답변을 찾지 못하셨나요?</h2>
          <p className="text-muted-foreground text-sm mb-6">평일 09:00~18:00 사이에 문의주시면 빠르게 답변드립니다.</p>
          <Link href="/contact" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 px-8')}>
            문의하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
