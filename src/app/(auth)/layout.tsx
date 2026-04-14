import { siteConfig } from '@/config/site'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            V
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {siteConfig.description}
        </p>
      </div>
      {children}
    </div>
  )
}
