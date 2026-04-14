'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { mapSupabaseError } from '@/lib/supabase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(mapSupabaseError(error))
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">이메일을 확인하세요</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{email}</span>로 인증 메일을 보냈습니다.
            메일함을 확인하고 링크를 클릭하여 가입을 완료하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            로그인으로 이동
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>새 계정을 만들어 VoxCierge를 시작하세요</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">이름</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="홍길동"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="8자 이상 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
