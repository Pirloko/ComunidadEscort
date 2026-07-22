import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { APP_TAGLINE } from '@/lib/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 flex w-full max-w-sm flex-col items-center gap-2 px-1 text-center">
        <BrandLogo size="lg" to="/home" className="max-w-[min(100%,240px)]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent sm:tracking-[0.18em]">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="content-shell w-full max-w-sm">
        <div className="mb-5 text-center">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle mt-1.5">{subtitle}</p>}
        </div>
        {children}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link to="/home" className="underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  )
}
