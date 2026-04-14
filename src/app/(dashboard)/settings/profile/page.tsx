'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  User,
  Camera,
  Globe,
  Lock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const TIMEZONES = [
  { value: 'Asia/Seoul', label: '서울 (UTC+9)' },
  { value: 'Asia/Tokyo', label: '도쿄 (UTC+9)' },
  { value: 'Asia/Shanghai', label: '상하이 (UTC+8)' },
  { value: 'America/New_York', label: '뉴욕 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (UTC-8)' },
  { value: 'Europe/London', label: '런던 (UTC+0)' },
  { value: 'Europe/Paris', label: '파리 (UTC+1)' },
  { value: 'UTC', label: 'UTC' },
]

const LOCALES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

function StatusMessage({ status }: { status: SaveStatus }) {
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        저장되었습니다
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        저장 실패
      </span>
    )
  }
  return null
}

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [timezone, setTimezone] = useState('Asia/Seoul')
  const [locale, setLocale] = useState('ko')
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>('idle')
  const [passwordError, setPasswordError] = useState('')

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)
    setEmail(user.email ?? '')

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, timezone, locale')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      setFullName(profile.full_name ?? '')
      setAvatarUrl(profile.avatar_url ?? '')
      setTimezone(profile.timezone ?? 'Asia/Seoul')
      setLocale(profile.locale ?? 'ko')
    } else {
      setFullName(user.user_metadata?.full_name ?? '')
    }
  }, [supabase])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSaveProfile = async () => {
    setProfileStatus('saving')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          timezone,
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      // Also update auth metadata
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })

      setProfileStatus('saved')
      setTimeout(() => setProfileStatus('idle'), 3000)
    } catch (err) {
      console.error('[ProfilePage] save error:', err)
      setProfileStatus('error')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setIsUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(path)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)

      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('[ProfilePage] avatar upload error:', err)
      alert('아바타 업로드에 실패했습니다.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordStatus('idle')

    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setPasswordStatus('saving')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPasswordStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordStatus('idle'), 3000)
    } catch (err) {
      console.error('[ProfilePage] password change error:', err)
      setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.')
      setPasswordStatus('error')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정 삭제') return
    setIsDeletingAccount(true)

    try {
      await fetch('/api/account/delete', { method: 'DELETE' })
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('[ProfilePage] delete account error:', err)
      alert('계정 삭제에 실패했습니다. 고객센터에 문의해 주세요.')
      setIsDeletingAccount(false)
    }
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">프로필 설정</h1>
        <p className="text-muted-foreground mt-1">개인 정보 및 계정 설정을 관리하세요</p>
      </div>

      {/* Avatar & Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            프로필 정보
          </CardTitle>
          <CardDescription>이름과 프로필 사진을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="프로필 사진"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                  {initials || <User className="h-6 w-6" />}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void handleAvatarUpload(e)}
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{fullName || '(이름 없음)'}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <Separator />

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">이름</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => void handleSaveProfile()}
              disabled={profileStatus === 'saving'}
            >
              {profileStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              변경 저장
            </Button>
            <StatusMessage status={profileStatus} />
          </div>
        </CardContent>
      </Card>

      {/* Language & Timezone */}
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
            <Select value={locale} onValueChange={(v) => { if (v !== null) setLocale(v) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>시간대</Label>
            <Select value={timezone} onValueChange={(v) => { if (v !== null) setTimezone(v) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => void handleSaveProfile()}
              disabled={profileStatus === 'saving'}
            >
              {profileStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              변경 저장
            </Button>
            <StatusMessage status={profileStatus} />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            비밀번호 변경
          </CardTitle>
          <CardDescription>새 비밀번호를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (최소 8자)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 재입력"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {passwordError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => void handleChangePassword()}
              disabled={passwordStatus === 'saving' || !newPassword || !confirmPassword}
            >
              {passwordStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              비밀번호 변경
            </Button>
            <StatusMessage status={passwordStatus} />
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            위험 구역
          </CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger render={
              <Button variant="destructive" size="sm" className="w-full">
                계정 삭제
              </Button>
            } />
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>계정을 삭제하시겠습니까?</DialogTitle>
                <DialogDescription>
                  모든 데이터(음성 기록, 할일, 설정)가 영구적으로 삭제됩니다. 이 작업은 되돌릴
                  수 없습니다.
                  <br />
                  <br />
                  계속하려면 아래에{' '}
                  <span className="font-semibold text-foreground">계정 삭제</span>를 입력하세요.
                </DialogDescription>
              </DialogHeader>

              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="계정 삭제"
                className="mt-2"
              />

              <DialogFooter>
                <DialogClose render={
                  <Button variant="outline" onClick={() => setDeleteConfirmText('')}>
                    취소
                  </Button>
                } />
                <Button
                  variant="destructive"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleteConfirmText !== '계정 삭제' || isDeletingAccount}
                >
                  {isDeletingAccount && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  계정 영구 삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
