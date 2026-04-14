import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/features', label: '기능' },
  { href: '/pricing', label: '가격' },
  { href: '/guide', label: '가이드' },
  { href: '/faq', label: 'FAQ' },
]

export function PublicNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              V
            </div>
            <span className="font-bold tracking-tight">{siteConfig.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground')}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          >
            시작하기
          </Link>
        </nav>
      </div>
    </header>
  )
}
