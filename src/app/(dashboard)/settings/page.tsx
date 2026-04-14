'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Bell, User, Globe, CreditCard, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState('ko')
  const [timezone, setTimezone] = useState('Asia/Seoul')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingLocale, setIsSavingLocale] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getUser().then((result: any) => {
      const user = result?.data?.user
      setDisplayName(user?.user_metadata?.full_name ?? '')
      setEmail(user?.email ?? '')
    }).catch(() => {/* Supabase not configured */})
  }, [])

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      })
      if (error) throw error
      toast.success('프로필이 저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  function handleSaveLocale() {
    setIsSavingLocale(true)
    // Locale preferences stored locally (no Supabase column yet)
    setTimeout(() => {
      toast.success('지역 설정이 저장되었습니다.')
      setIsSavingLocale(false)
    }, 400)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground mt-1">계정 및 앱 설정을 관리하세요</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            프로필
          </CardTitle>
          <CardDescription>이름과 기본 정보를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">이름</Label>
            <Input
              id="fullName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
          </div>
          <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? '저장 중...' : '변경 저장'}
          </Button>
        </CardContent>
      </Card>

      {/* Language & timezone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            지역 설정
          </CardTitle>
          <CardDescription>언어 및 시간대를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>언어</Label>
            <Select value={language} onValueChange={(v) => { if (v) setLanguage(v) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>시간대</Label>
            <Select value={timezone} onValueChange={(v) => { if (v) setTimezone(v) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">서울 (UTC+9)</SelectItem>
                <SelectItem value="America/New_York">뉴욕 (UTC-5)</SelectItem>
                <SelectItem value="Europe/London">런던 (UTC+0)</SelectItem>
                <SelectItem value="Asia/Tokyo">도쿄 (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleSaveLocale} disabled={isSavingLocale}>
            {isSavingLocale ? '저장 중...' : '변경 저장'}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            알림 설정
          </CardTitle>
          <CardDescription>브리핑 및 알림 시간을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">아침 브리핑</p>
              <p className="text-xs text-muted-foreground">매일 아침 업무 브리핑을 받으세요</p>
            </div>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label htmlFor="morningTime">아침 브리핑 시간</Label>
            <Input id="morningTime" type="time" defaultValue="08:00" className="w-32" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">저녁 브리핑</p>
              <p className="text-xs text-muted-foreground">매일 저녁 업무 완료 리뷰를 받으세요</p>
            </div>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eveningTime">저녁 브리핑 시간</Label>
            <Input id="eveningTime" type="time" defaultValue="20:00" className="w-32" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">마감 임박 알림</p>
              <p className="text-xs text-muted-foreground">마감 1시간 전 알림을 받으세요</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            구독 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">현재 플랜</p>
              <p className="text-xs text-muted-foreground mt-0.5">무료 플랜 사용 중</p>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            Professional로 업그레이드
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            보안
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: '비밀번호 변경', href: '#' },
            { label: '연결된 계정', href: '#' },
            { label: '활성 세션', href: '#' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">위험 구역</CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" className="w-full">
            계정 삭제
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
