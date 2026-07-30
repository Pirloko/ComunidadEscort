import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LogIn,
  LayoutDashboard,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { DestacadasCarousel } from '@/features/home/components/DestacadasCarousel'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canAccessCommunity } from '@/lib/account-access'
import { APP_TAGLINE } from '@/lib/constants'
import { habitacionesEscortCityPath, setDocumentMeta } from '@/lib/seo-habitaciones'
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

export function HomePage() {
  const { session, profile } = useAuth()

  const { data: citiesWithRooms = [], isLoading: loadingCities } = useQuery({
    queryKey: ['public-habitacion-cities'],
    queryFn: () => resourceService.getPublicHabitacionCities(),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    setDocumentMeta({
      title: 'Habitaciones y piezas para escort en Chile | Comunidadescort',
      description:
        'Encuentra habitaciones o piezas para escort por ciudad en Chile. Destacadas, contacto directo y comunidad privada en Comunidadescort.cl.',
    })
  }, [])

  const loggedIn = !!session
  const canEnter = profile ? canAccessCommunity(profile) : false
  const totalPublic = citiesWithRooms.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="home-landing home-landing-bg relative min-h-dvh overflow-x-hidden">
      <div className="home-landing-mesh absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:h-16">
          <BrandLogo size="md" to="/home" tone="dark" className="h-10 max-w-[min(100%,180px)] sm:h-12 sm:max-w-[min(100%,220px)]" />
          <div className="flex shrink-0 items-center gap-1.5">
            {loggedIn && canEnter ? (
              <Button
                asChild
                size="sm"
                variant="accent"
                className="home-btn-enter h-9 gap-1.5 rounded-full px-3.5 font-semibold"
              >
                <Link to="/feed">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  Comunidad
                </Link>
              </Button>
            ) : loggedIn ? (
              <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3.5 font-medium">
                <Link to="/cuenta-pendiente">Mi cuenta</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="accent"
                className="home-btn-enter h-9 gap-1.5 rounded-full px-3.5 font-semibold"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4 shrink-0" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg space-y-8 px-3 pb-[max(3rem,env(safe-area-inset-bottom))] pt-5 sm:space-y-10 sm:pt-6">
        <section id="habitaciones" className="scroll-mt-16 space-y-4">
          <div className="home-cities-intro">
            <p className="home-cities-eyebrow home-fade-up">
              <span className="home-cities-eyebrow-text">Habitaciones y piezas</span>
            </p>
            <h1 className="home-display home-cities-title home-fade-up home-fade-up-delay-1">
              Elige tu ciudad
            </h1>
            <p className="home-cities-sub home-fade-up home-fade-up-delay-2">
              <MapPin className="home-cities-sub-icon" aria-hidden />
              <span>Solo ciudades con publicaciones activas</span>
            </p>
          </div>

          <div className="home-fade-up home-fade-up-delay-3 rounded-xl border border-white/8 bg-card/60 p-3 backdrop-blur-sm">
            {loadingCities ? (
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            ) : citiesWithRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay habitaciones públicas publicadas.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={cn(
                    'home-city-btn flex h-auto min-h-10 w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-muted/40 px-1.5 py-2 text-center text-[0.7rem] leading-tight text-muted-foreground sm:flex-row sm:gap-1.5 sm:text-sm',
                  )}
                  aria-label={`${totalPublic} publicaciones en total`}
                >
                  <span className="truncate">Todas</span>
                  <span className="rounded-full bg-background/20 px-1.5 text-[10px] tabular-nums">
                    {totalPublic}
                  </span>
                </div>
                {citiesWithRooms.map((c) => (
                  <Link
                    key={c.id}
                    to={habitacionesEscortCityPath(c.slug)}
                    className={cn(
                      'home-city-btn flex h-auto min-h-10 w-full flex-col items-center justify-center gap-0.5 border border-white/10 bg-card px-1.5 py-2 text-center text-[0.7rem] font-medium leading-tight text-foreground transition hover:border-accent/45 hover:bg-accent/10 sm:flex-row sm:gap-1.5 sm:text-sm',
                    )}
                    title={`Habitaciones o piezas para escort en ${c.name}`}
                  >
                    <span className="line-clamp-2 break-words">{c.name}</span>
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                      {c.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <DestacadasCarousel />

        <SafetyTipsSection />

        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card/80 to-card p-5">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div>
              <p className="eyebrow text-primary">Si eres escort</p>
              <h2 className="home-display home-cities-title mt-1.5 !text-[clamp(1.55rem,6vw,2.1rem)] text-foreground">
                Haz tuya la comunidad
              </h2>
              <p className="page-subtitle mt-2.5 leading-relaxed">
                Hospedaje confiable, avisos de seguridad y apoyo entre colegas. Un espacio
                privado, pensado para cuidarte.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {!loggedIn ? (
                <>
                  <Button
                    asChild
                    variant="accent"
                    className="home-btn-cta h-12 w-full gap-2 rounded-xl text-base font-semibold"
                  >
                    <Link to="/register">
                      Solicitar acceso
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Registro con revisión. Tu identidad se trata con discreción.
                  </p>
                </>
              ) : canEnter ? (
                <Button
                  asChild
                  variant="accent"
                  className="home-btn-cta h-12 w-full gap-2 rounded-xl text-base font-semibold"
                >
                  <Link to="/feed">
                    Ir al feed
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="h-12 w-full rounded-xl font-semibold">
                  <Link to="/cuenta-pendiente">Seguir mi solicitud</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 pt-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {APP_TAGLINE}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            Comunidad privada · Chile
          </p>
        </footer>
      </main>
    </div>
  )
}
