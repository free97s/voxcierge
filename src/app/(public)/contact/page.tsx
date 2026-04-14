'use client'

import { useState } from 'react'
import { Mail, Clock, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

const categories = [
  { value: 'general', label: '일반 문의' },
  { value: 'billing', label: '결제 문의' },
  { value: 'technical', label: '기술 지원' },
  { value: 'partnership', label: '파트너십' },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'general',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('모든 필수 항목을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    // Placeholder: 실제 전송 로직
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    toast.success('문의가 접수되었습니다. 영업일 기준 1~2일 내에 답변 드리겠습니다.')
    setForm({ name: '', email: '', category: 'general', message: '' })
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            고객센터
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            무엇이든{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              도와드릴게요
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed">
            궁금한 점, 불편한 점, 개선 제안까지 무엇이든 말씀해 주세요.
            전담 팀이 신속하게 답변 드리겠습니다.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold tracking-tight">연락처 정보</h2>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">이메일</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:recollect@hawoolab.app"
                  className="text-sm text-primary hover:underline"
                >
                  recollect@hawoolab.app
                </a>
                <CardDescription className="text-xs mt-1">
                  일반 문의 및 기술 지원
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">운영 시간</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">평일 09:00 ~ 18:00</p>
                <CardDescription className="text-xs mt-1">
                  KST (한국 표준시 기준)<br />
                  주말 및 공휴일 휴무
                </CardDescription>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">응답 시간 안내</p>
              <p>접수 후 영업일 기준 1~2일 이내에 답변 드립니다. 복잡한 기술 문의는 최대 3일이 소요될 수 있습니다.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold tracking-tight mb-4">문의 작성</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">
                    이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="홍길동"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">
                    이메일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">문의 유형</Label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">
                  메시지 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="문의 내용을 자세히 작성해 주세요."
                  value={form.message}
                  onChange={handleChange}
                  className="min-h-[140px]"
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="gap-2 self-end">
                {submitting ? '전송 중...' : '문의 보내기'}
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
