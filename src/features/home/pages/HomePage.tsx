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
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

export function HomePage() {
  const { session, profile } = useAuth()
  const [cityId, setCityId] = useState('')
  const [soloBanoPrivado, setSoloBanoPrivado] = useState(false)

  const { data: citiesWithRooms = [], isLoading: loadingCities } = useQuery({
    queryKey: ['public-habitacion-cities'],
    queryFn: () => resourceService.getPublicHabitacionCities(),
  })

  const filters = useMemo(
    () => ({
      cityId: cityId || undefined,
      tiene_bano_privado: soloBanoPrivado || undefined,
    }),
    [cityId, soloBanoPrivado],
  )

  const { data: habitaciones = [], isLoading } = useQuery({
    queryKey: ['public-habitaciones', filters],
    queryFn: () => resourceService.getPublicHabitaciones(filters),
  })

  const loggedIn = !!session
  const canEnter = profile ? canAccessCommunity(profile) : false
  const totalPublic = citiesWithRooms.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="home-landing home-landing-bg relative min-h-dvh overflow-x-hidden">
      <div className="home-landing-mesh absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2 px-3">
          <BrandLogo size="md" to="/home" tone="dark" className="h-12 max-w-[min(100%,220px)]" />
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

      <main className="relative mx-auto max-w-lg space-y-10 px-3 pb-12 pt-6">
        {/* Ciudades */}
        <section id="habitaciones" className="scroll-mt-16 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Habitaciones para escort
            </p>
            <h2 className="home-display mt-1 text-xl font-semibold text-foreground">
              Elige tu ciudad
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Solo ciudades con publicaciones activas
            </p>
          </div>

          <div className="rounded-xl border border-white/8 bg-card/60 p-3 backdrop-blur-sm">
            {loadingCities ? (
              <div className="flex gap-2 overflow-hidden">
                <Skeleton className="h-9 w-20 shrink-0 rounded-md" />
                <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
                <Skeleton className="h-9 w-28 shrink-0 rounded-md" />
              </div>
            ) : citiesWithRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay habitaciones públicas publicadas.
              </p>
            ) : (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Button
                  type="button"
                  size="sm"
                  variant={cityId === '' ? 'accent' : 'outline'}
                  className={cn('home-city-btn shrink-0 gap-1.5', cityId === '' && 'shadow-sm')}
                  onClick={() => setCityId('')}
                >
                  Todas
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
                      'home-city-btn shrink-0 gap-1.5',
                      cityId === c.id && 'shadow-sm',
                    )}
                    onClick={() => setCityId(c.id === cityId ? '' : c.id)}
                  >
                    {c.name}
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

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={soloBanoPrivado ? 'accent' : 'outline'}
              className={cn('shrink-0', soloBanoPrivado && 'shadow-sm')}
              onClick={() => setSoloBanoPrivado((v) => !v)}
            >
              Baño privado
            </Button>
          </div>
        </section>

        {/* Resultados */}
        <section className="space-y-4">
          <h2 className="home-display text-lg font-semibold text-foreground">
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

          {!isLoading && habitaciones.length === 0 && (
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Si eres escort
              </p>
              <h2 className="home-display mt-1.5 text-xl font-semibold text-foreground">
                Haz tuya la comunidad
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
