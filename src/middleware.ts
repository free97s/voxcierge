import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/callback', '/test']

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/api/webhooks/')) return true
  if (pathname.startsWith('/api/cron/')) return true
  return false
}

function isProtectedRoute(pathname: string): boolean {
  if (pathname.startsWith('/(dashboard)') || pathname.match(/^\/(dashboard)/)) return true
  if (pathname.startsWith('/api/')) return true
  if (
    pathname.startsWith('/home') ||
    pathname.startsWith('/capture') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/briefing')
  ) return true
  return false
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request })
  }

  // Supabase 미설정 시 인증 우회 — 모든 페이지 접근 허용
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
