import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  MapPin,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canAccessCommunity } from '@/lib/account-access'
import { PUBLIC_HABITACIONES_PAGE_SIZE } from '@/lib/habitaciones'
import {
  citySeoDescription,
  citySeoH1,
  citySeoIntro,
  citySeoTitle,
  buildCityJsonLd,
  habitacionesEscortCityPath,
  parseLegacyEscortCityPath,
  setDocumentMeta,
} from '@/lib/seo-habitaciones'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

export function HabitacionesCityPage() {
  const { citySlug } = useParams<{ citySlug: string }>()
  const { session, profile } = useAuth()
  const [pageByCity, setPageByCity] = useState<Record<string, number>>({})

  const { data: citiesWithRooms = [], isLoading: loadingCities } = useQuery({
    queryKey: ['public-habitacion-cities'],
    queryFn: () => resourceService.getPublicHabitacionCities(),
  })

  const city = citiesWithRooms.find((c) => c.slug === citySlug)
  const total = city?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PUBLIC_HABITACIONES_PAGE_SIZE))
  const page = citySlug ? (pageByCity[citySlug] ?? 1) : 1
  const queryPage = Math.min(Math.max(1, page), totalPages)
  const listRef = useRef<HTMLElement>(null)

  const setPage = (next: number) => {
    if (!citySlug) return
    setPageByCity((prev) => ({ ...prev, [citySlug]: next }))
  }

  const { data: habitaciones = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['public-habitaciones', 'city', city?.id, queryPage],
    queryFn: () =>
      resourceService.getPublicHabitaciones({
        cityId: city!.id,
        limit: PUBLIC_HABITACIONES_PAGE_SIZE,
        offset: (queryPage - 1) * PUBLIC_HABITACIONES_PAGE_SIZE,
      }),
    enabled: !!city?.id,
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (!city) return
    setDocumentMeta({
      title: citySeoTitle(city.name),
      description: citySeoDescription(city.name),
      path: habitacionesEscortCityPath(city.slug),
      jsonLd: buildCityJsonLd(city.name, city.slug, city.count),
    })
  }, [city])

  const goToPage = (next: number) => {
    setPage(next)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const loggedIn = !!session
  const canEnter = profile ? canAccessCommunity(profile) : false

  if (!citySlug) return <Navigate to="/home" replace />

  if (!loadingCities && !city) {
    return (
      <div className="home-landing home-landing-bg flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center p-4">
          <EmptyState
            icon={MapPin}
            title="Ciudad no encontrada"
            description="No hay habitaciones públicas con esa ciudad, o el enlace no es válido."
            action={
              <Button asChild variant="outline">
                <Link to="/home">Volver al inicio</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="home-landing home-landing-bg relative min-h-dvh overflow-x-hidden">
      <div className="home-landing-mesh absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:h-[4.5rem]">
          <BrandLogo
            size="lg"
            to="/home"
            tone="dark"
            className="h-12 max-w-[min(100%,240px)] sm:h-14 sm:max-w-[min(100%,280px)]"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            {loggedIn && canEnter ? (
              <Button asChild size="sm" variant="accent" className="home-btn-enter h-9 gap-1.5 rounded-full px-3.5 font-semibold">
                <Link to="/feed">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  Comunidad
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="accent" className="home-btn-enter h-9 gap-1.5 rounded-full px-3.5 font-semibold">
                <Link to="/login">
                  <LogIn className="h-4 w-4 shrink-0" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg space-y-6 px-3 pb-[max(3rem,env(safe-area-inset-bottom))] pt-5">
        <Link to="/home" className="habitacion-back-link home-fade-up inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Habitaciones para escort en Chile
        </Link>

        <header className="home-cities-intro space-y-2">
          <p className="home-cities-eyebrow">
            <span className="home-cities-eyebrow-text">
              Piezas y habitaciones · {city?.name ?? 'ciudad'}
            </span>
          </p>
          <h1 className="home-display home-cities-title">
            {city ? citySeoH1(city.name) : 'Habitaciones y piezas para escort'}
          </h1>
          {city && (
            <p className="page-subtitle leading-relaxed">{citySeoIntro(city.name, city.count)}</p>
          )}
          <p className="text-sm text-muted-foreground">
            ¿Buscas en otra región?{' '}
            <Link to="/home" className="font-medium text-primary underline-offset-2 hover:underline">
              Ver habitaciones para escort en todo Chile
            </Link>
          </p>
        </header>

        <section
          ref={listRef}
          className="scroll-mt-20 space-y-4"
          aria-label={`Listado en ${city?.name ?? 'ciudad'}`}
        >
          {(loadingCities || (isLoading && habitaciones.length === 0)) && (
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

          {!loadingCities && !isLoading && !isError && habitaciones.length === 0 && (
            <EmptyState
              icon={Search}
              title="Sin habitaciones"
              description={`Aún no hay habitaciones públicas en ${city?.name ?? 'esta ciudad'}.`}
            />
          )}

          {!isError && habitaciones.length > 0 && (
            <div className={`space-y-4 ${isFetching && !isLoading ? 'opacity-70' : ''}`}>
              <p className="text-sm text-muted-foreground">
                Página {queryPage} de {totalPages}
                {total > 0 ? ` · ${total} publicación${total !== 1 ? 'es' : ''}` : ''}
              </p>
              {habitaciones.map((h) => (
                <HabitacionCard
                  key={h.id}
                  habitacion={h}
                  detailTo={`/home/habitaciones/${h.id}`}
                />
              ))}
              {totalPages > 1 && (
                <nav
                  className="habitacion-pagination flex flex-wrap items-center justify-center gap-1.5 pt-2"
                  aria-label="Paginación del listado"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="habitacion-page-btn"
                    disabled={queryPage <= 1}
                    onClick={() => goToPage(queryPage - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={p === queryPage ? 'accent' : 'outline'}
                      className="habitacion-page-btn min-w-9"
                      onClick={() => goToPage(p)}
                      aria-label={`Página ${p}`}
                      aria-current={p === queryPage ? 'page' : undefined}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="habitacion-page-btn"
                    disabled={queryPage >= totalPages}
                    onClick={() => goToPage(queryPage + 1)}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              )}
            </div>
          )}
        </section>

        {!loadingCities && citiesWithRooms.length > 1 && (
          <nav aria-label="Otras ciudades" className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Otras ciudades</p>
            <div className="flex flex-wrap gap-2">
              {citiesWithRooms
                .filter((c) => c.slug !== citySlug)
                .slice(0, 12)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={habitacionesEscortCityPath(c.slug)}
                    className="rounded-lg border border-white/10 bg-card/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/40"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </nav>
        )}
      </main>
    </div>
  )
}

/** Redirect SEO: piezas/alcobas → habitaciones (evita contenido duplicado). */
export function PiezasEscortCityRedirect() {
  const { citySlug } = useParams<{ citySlug: string }>()
  if (!citySlug) return <Navigate to="/home" replace />
  return <Navigate to={habitacionesEscortCityPath(citySlug)} replace />
}

/** Redirect legacy /habitaciones-escort-puerto-montt → /habitaciones-escort/puerto-montt */
export function LegacyEscortCityRedirect() {
  const { seoCityPage } = useParams<{ seoCityPage: string }>()
  if (!seoCityPage) return <Navigate to="/home" replace />
  const parsed = parseLegacyEscortCityPath(seoCityPage)
  if (!parsed) return <Navigate to="/home" replace />
  return <Navigate to={habitacionesEscortCityPath(parsed.citySlug)} replace />
}
