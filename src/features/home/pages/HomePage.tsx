import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  LogIn,
  LayoutDashboard,
  MapPin,
  Lock,
  Users,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canAccessCommunity } from '@/lib/account-access'
import { APP_TAGLINE } from '@/lib/constants'
import { PUBLIC_HABITACIONES_PAGE_SIZE } from '@/lib/habitaciones'
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'
import '@/features/home/home-landing.css'

export function HomePage() {
  const { session, profile } = useAuth()
  const [cityId, setCityId] = useState('')
  const [habitaciones, setHabitaciones] = useState<Resource[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const { data: citiesWithRooms = [], isLoading: loadingCities } = useQuery({
    queryKey: ['public-habitacion-cities'],
    queryFn: () => resourceService.getPublicHabitacionCities(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const filters = useMemo(
    () => ({
      cityId: cityId || undefined,
    }),
    [cityId],
  )

  const { isLoading, isError, refetch } = useQuery({
    queryKey: ['public-habitaciones', filters],
    queryFn: async () => {
      const page = await resourceService.getPublicHabitaciones({
        ...filters,
        limit: PUBLIC_HABITACIONES_PAGE_SIZE,
        offset: 0,
      })
      setHabitaciones(page)
      setHasMore(page.length >= PUBLIC_HABITACIONES_PAGE_SIZE)
      return page
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const page = await resourceService.getPublicHabitaciones({
        ...filters,
        limit: PUBLIC_HABITACIONES_PAGE_SIZE,
        offset: habitaciones.length,
      })
      setHabitaciones((prev) => [...prev, ...page])
      setHasMore(page.length >= PUBLIC_HABITACIONES_PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

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
        {/* Ciudades */}
        <section id="habitaciones" className="scroll-mt-16 space-y-4">
          <div className="home-cities-intro">
            <p className="home-cities-eyebrow home-fade-up">
              <span className="home-cities-eyebrow-text">Habitaciones para escort</span>
            </p>
            <h2 className="home-display home-cities-title home-fade-up home-fade-up-delay-1">
              Elige tu ciudad
            </h2>
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
                <Button
                  type="button"
                  size="sm"
                  variant={cityId === '' ? 'accent' : 'outline'}
                  className={cn(
                    'home-city-btn h-auto min-h-10 w-full flex-col gap-0.5 px-1.5 py-2 text-center text-[0.7rem] leading-tight sm:flex-row sm:gap-1.5 sm:text-sm',
                    cityId === '' && 'shadow-sm',
                  )}
                  onClick={() => setCityId('')}
                >
                  <span className="truncate">Todas</span>
                  <span className="rounded-full bg-background/20 px-1.5 text-[10px] tabular-nums">
                    {totalPublic}
                  </span>
                </Button>
                {citiesWithRooms.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    size="sm"
                    variant={cityId === c.id ? 'accent' : 'outline'}
                    className={cn(
                      'home-city-btn h-auto min-h-10 w-full flex-col gap-0.5 px-1.5 py-2 text-center text-[0.7rem] leading-tight sm:flex-row sm:gap-1.5 sm:text-sm',
                      cityId === c.id && 'shadow-sm',
                    )}
                    onClick={() => setCityId(c.id === cityId ? '' : c.id)}
                  >
                    <span className="line-clamp-2 break-words">{c.name}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-[10px] tabular-nums',
                        cityId === c.id ? 'bg-background/20' : 'bg-muted',
                      )}
                    >
                      {c.count}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Resultados */}
        <section className="space-y-4">
          <h2 className="home-display section-title text-foreground">
            Publicaciones
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({habitaciones.length})
              </span>
            )}
          </h2>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          )}

          {!isLoading && isError && (
            <EmptyState
              icon={Search}
              title="No se pudieron cargar"
              description="Revisa tu conexión e inténtalo de nuevo."
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            />
          )}

          {!isLoading && !isError && habitaciones.length === 0 && (
            <EmptyState
              icon={Search}
              title="Sin habitaciones"
              description="No hay habitaciones públicas en esta ciudad."
            />
          )}

          {!isLoading && habitaciones.length > 0 && (
            <div className="space-y-4">
              {habitaciones.map((h) => (
                <HabitacionCard
                  key={h.id}
                  habitacion={h}
                  detailTo={`/home/habitaciones/${h.id}`}
                />
              ))}
              {hasMore && (
                <Button
                  type="button"
                  variant="outline"
                  className="habitacion-cta-secondary h-11 w-full rounded-xl font-semibold"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más habitaciones'}
                </Button>
              )}
            </div>
          )}
        </section>

        <SafetyTipsSection />

        {/* Invitación escorts — cierre */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card/80 to-card p-5">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div>
              <p className="eyebrow text-primary">
                Si eres escort
              </p>
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

        {/* Confianza */}
        <section className="grid gap-2.5">
          {[
            {
              icon: Lock,
              title: 'Acceso con revisión',
              body: 'La comunidad es privada: cada cuenta pasa por verificación antes de entrar.',
            },
            {
              icon: Users,
              title: 'Apoyo entre pares',
              body: 'Alertas, datos útiles y conversaciones pensadas para tu seguridad diaria.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-white/8 bg-card/50 p-4 backdrop-blur-sm"
            >
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/5 px-3 py-8 text-center">
        <BrandLogo size="sm" to={null} decorative tone="dark" className="mx-auto max-w-[160px]" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {APP_TAGLINE}
        </p>
      </footer>
    </div>
  )
}
