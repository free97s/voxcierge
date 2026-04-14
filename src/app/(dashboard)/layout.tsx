'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Mic,
  CheckSquare,
  BarChart3,
  Clock,
  Settings,
  LogOut,
  Menu,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const baseNavItems = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/capture', label: '음성캡처', icon: Mic },
  { href: '/tasks', label: '할일', icon: CheckSquare },
  { href: '/insights', label: '인사이트', icon: BarChart3 },
  { href: '/history', label: '히스토리', icon: Clock },
  { href: '/settings', label: '설정', icon: Settings },
]

const devNavItems = [
  { href: '/test', label: '테스트', icon: FlaskConical },
]

const navItems = [
  ...baseNavItems,
  ...(process.env.NODE_ENV === 'development' ? devNavItems : []),
]

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

function UserProfileCard() {
  return (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src="" alt="사용자" />
        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
          나
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">내 계정</p>
        <Badge variant="secondary" className="mt-0.5 text-[10px] h-4 px-1.5">
          Personal
        </Badge>
      </div>
    </div>
  )
}

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string
  onNavClick?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-0">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 gap-2 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          V
        </div>
        <span className="font-bold text-lg tracking-tight">VoxCierge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* User profile mini card */}
      <UserProfileCard />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="메뉴 열기"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <SidebarContent
                  pathname={pathname}
                  onNavClick={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Mobile branding */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                V
              </div>
              <span className="font-bold tracking-tight">VoxCierge</span>
            </div>
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="사용자 메뉴"
                />
              }
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="사용자" />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  나
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                render={<Link href="/settings" className="flex w-full items-center" />}
              >
                설정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex border-t bg-card md:hidden shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
