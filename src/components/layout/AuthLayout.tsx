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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-6 flex w-full max-w-sm flex-col items-center gap-2 text-center">
        <BrandLogo size="lg" to="/home" className="max-w-[240px]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
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
