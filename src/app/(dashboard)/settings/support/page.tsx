'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  HelpCircle,
  Sparkles,
  Mail,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Headphones,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Inline FAQ accordion
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: '음성이 인식되지 않아요',
    a: '마이크 권한을 허용했는지 확인하세요. 브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭해 마이크 권한을 확인할 수 있습니다. Chrome, Edge, Safari 최신 버전을 사용하는 것을 권장합니다. 가능하면 조용한 환경에서 마이크에 가까이 대고 말씀해 주세요.',
  },
  {
    q: '할 일이 저장되지 않아요',
    a: '네트워크 연결 상태를 먼저 확인해 주세요. 로그인 세션이 만료되었을 수 있으니 로그아웃 후 다시 로그인해 보세요. 문제가 지속된다면 페이지를 새로고침(F5)하거나 브라우저 캐시를 지운 뒤 재시도해 주세요.',
  },
  {
    q: '브리핑이 생성되지 않아요',
    a: 'AI 서비스 상태가 일시적으로 불안정할 수 있습니다. 잠시 후 다시 시도해 주세요. 브리핑이 생성되려면 할 일이 최소 1개 이상 등록되어 있어야 합니다. 할 일 목록을 확인하고 다시 시도해 보세요.',
  },
  {
    q: '캘린더가 연동되지 않아요',
    a: 'OAuth 인증이 만료되었을 수 있습니다. 설정 > 캘린더 연동 메뉴에서 연결 해제 후 다시 인증해 주세요. Google 또는 Outlook 계정의 서드파티 앱 접근 권한 설정에서 VoxCierge가 허용되어 있는지도 확인해 주세요.',
  },
  {
    q: '결제/구독을 변경하고 싶어요',
    a: '설정 > 결제 및 구독 페이지에서 플랜을 변경하거나 구독을 취소할 수 있습니다. 구독 관리는 Stripe 고객 포털을 통해 진행되며, 언제든지 취소하거나 플랜을 변경할 수 있습니다.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick help card
// ---------------------------------------------------------------------------

interface QuickCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

function QuickCard({ icon, title, description, href }: QuickCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full cursor-pointer transition-colors hover:border-primary/40">
        <CardContent className="flex flex-col items-start gap-3 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-auto" />
        </CardContent>
      </Card>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SupportPage() {
  const [inquiryType, setInquiryType] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true)
  const [isSending, setIsSending] = useState(false)

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setIsSending(true)
    // Simulate network request
    setTimeout(() => {
      setIsSending(false)
      setInquiryType('')
      setSubject('')
      setBody('')
      toast.success('문의가 접수되었습니다. 24시간 이내 답변 드리겠습니다.')
    }, 800)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          고객센터
        </h1>
        <p className="text-muted-foreground mt-1">도움이 필요하신가요? 언제든 문의해 주세요</p>
      </div>

      {/* Quick help cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard
          icon={<BookOpen className="h-5 w-5" />}
          title="사용 가이드"
          description="VoxCierge 사용법을 알아보세요"
          href="/guide"
        />
        <QuickCard
          icon={<HelpCircle className="h-5 w-5" />}
          title="자주 묻는 질문"
          description="궁금한 점을 빠르게 해결하세요"
          href="/faq"
        />
        <QuickCard
          icon={<Sparkles className="h-5 w-5" />}
          title="기능 소개"
          description="VoxCierge의 모든 기능을 확인하세요"
          href="/features"
        />
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">문의하기</CardTitle>
          <CardDescription>이메일로 문의하시면 빠르게 답변드립니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">이메일 문의</p>
              <a
                href="mailto:support@voxcierge.com"
                className="text-sm text-primary hover:underline"
              >
                support@voxcierge.com
              </a>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">운영 시간</p>
              <p className="text-sm text-muted-foreground">평일 09:00 ~ 18:00 (KST)</p>
              <p className="text-xs text-muted-foreground mt-0.5">주말 및 공휴일 휴무</p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            평균 응답 시간: <span className="font-medium text-foreground">영업일 기준 24시간 이내</span>
          </div>
        </CardContent>
      </Card>

      {/* In-app inquiry form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">인앱 문의</CardTitle>
          <CardDescription>양식을 작성하시면 담당자가 이메일로 답변드립니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inquiry-type">문의 유형</Label>
              <Select value={inquiryType} onValueChange={(v) => { if (v) setInquiryType(v) }}>
                <SelectTrigger id="inquiry-type" className="w-full">
                  <SelectValue placeholder="문의 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반 문의</SelectItem>
                  <SelectItem value="billing">결제·환불</SelectItem>
                  <SelectItem value="technical">기술 문제</SelectItem>
                  <SelectItem value="voice">음성 인식 문제</SelectItem>
                  <SelectItem value="feature">기능 제안</SelectItem>
                  <SelectItem value="bug">버그 신고</SelectItem>
                  <SelectItem value="account">계정 문제</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-subject">제목</Label>
              <Input
                id="inquiry-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="문의 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-body">상세 내용</Label>
              <Textarea
                id="inquiry-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="문의 내용을 자세히 적어주세요. 발생 시점, 재현 방법, 오류 메시지 등을 함께 알려주시면 빠른 처리에 도움이 됩니다."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-attachment">스크린샷 첨부 (선택)</Label>
              <Input
                id="inquiry-attachment"
                type="file"
                accept="image/*"
                className="cursor-pointer text-sm file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary"
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
              <Switch
                id="system-info"
                checked={includeSystemInfo}
                onCheckedChange={setIncludeSystemInfo}
              />
              <div>
                <Label htmlFor="system-info" className="cursor-pointer font-medium text-sm">
                  시스템 정보 자동 포함
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  브라우저, OS 정보를 함께 전송합니다
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? '전송 중...' : '문의 보내기'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Inline FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">자주 찾는 도움말</CardTitle>
          <CardDescription>자주 발생하는 문제와 해결 방법을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">법적 고지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: '개인정보처리방침', href: '/privacy' },
            { label: '이용약관', href: '/terms' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <span>{item.label}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* App info */}
      <div className="text-center text-xs text-muted-foreground space-y-0.5 pb-2">
        <p className="font-medium text-foreground">VoxCierge</p>
        <p>버전 v1.0.0</p>
        <p>개발사: VoxCierge Team</p>
      </div>
    </div>
  )
}
