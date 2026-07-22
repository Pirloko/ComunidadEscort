import { useLocation } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { isSmartphoneClient } from '@/lib/device'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import '@/features/home/home-landing.css'

/** Rutas de auth necesarias tras entrar por /admin en PC (sin publicidad en la UI). */
const DESKTOP_AUTH_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
  '/cambiar-password-obligatorio',
])

function isDesktopAdminEntryPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

interface DeviceGateProps {
  children: React.ReactNode
}

/**
 * Bloquea PC/tablet para no-admin. Admin sin restricción.
 * En escritorio: entrar por /admin → redirige a /login (sin CTA público).
 */
export function DeviceGate({ children }: DeviceGateProps) {
  const { profile, session, isLoading } = useAuth()
  const location = useLocation()
  const isAdmin = profile?.role === 'admin'
  const onPhone = isSmartphoneClient()
  const allowDesktopAdminFlow =
    !session &&
    (isDesktopAdminEntryPath(location.pathname) || DESKTOP_AUTH_PATHS.has(location.pathname))

  if (!onPhone && isLoading) {
    return <PageLoader />
  }

  if (!onPhone && !isAdmin && !allowDesktopAdminFlow) {
    return (
      <div className="home-landing home-landing-bg flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-card/80 p-6 text-center shadow-xl backdrop-blur-md">
          <BrandLogo size="md" to={null} decorative tone="dark" className="mx-auto h-12 max-w-[200px]" />
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/15">
            <Smartphone className="h-6 w-6 text-accent" />
          </span>
          <div className="space-y-2">
            <h1 className="home-display text-2xl font-semibold text-foreground">
              Usa tu celular
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Comunidadescort está pensada para usarse desde un smartphone. Abre este enlace en
              tu teléfono para entrar a la comunidad y ver las habitaciones.
            </p>
          </div>
          <Button asChild variant="accent" className="home-btn-cta h-11 w-full rounded-xl font-semibold">
            <a href={typeof window !== 'undefined' ? window.location.href : '/home'}>
              Ya estoy en el celular — reintentar
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return children
}
