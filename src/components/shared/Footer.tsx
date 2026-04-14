import Link from 'next/link'
import { siteConfig } from '@/config/site'

const footerLinks = {
  service: {
    label: '서비스',
    links: [
      { href: '/features', label: '기능 소개' },
      { href: '/pricing', label: '가격' },
      { href: '/guide', label: '사용 가이드' },
    ],
  },
  support: {
    label: '고객 지원',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: '문의하기' },
    ],
  },
  legal: {
    label: '법적 고지',
    links: [
      { href: '/privacy', label: '개인정보처리방침' },
      { href: '/terms', label: '이용약관' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                V
              </div>
              <span className="font-bold tracking-tight">{siteConfig.name}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>대표: -</p>
              <p>사업자등록번호: -</p>
              <p>
                이메일:{' '}
                <a
                  href="mailto:support@voxcierge.com"
                  className="hover:text-foreground transition-colors"
                >
                  support@voxcierge.com
                </a>
              </p>
            </div>
          </div>

          {/* Service Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{footerLinks.service.label}</h3>
            <ul className="space-y-2">
              {footerLinks.service.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{footerLinks.support.label}</h3>
            <ul className="space-y-2">
              {footerLinks.support.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{footerLinks.legal.label}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
          <p>말하는 대로 이루어지는 업무의 흐름</p>
        </div>
      </div>
    </footer>
  )
}
