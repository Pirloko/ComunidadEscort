import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Home, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { useCity } from '@/features/cities/context/CityContext'
import { CASAS_PAGE_SIZE } from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

export function CasasPage() {
  const { cities } = useCity()
  const [cityId, setCityId] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLElement>(null)

  const cityQuery = citySearch.trim().toLowerCase()

  const filteredCities = useMemo(() => {
    if (!cityQuery) return cities
    return cities.filter((c) => c.name.toLowerCase().includes(cityQuery))
  }, [cities, cityQuery])

  const cityIdsFilter = useMemo(() => {
    if (cityId) return undefined
    if (!cityQuery) return undefined
    return filteredCities.map((c) => c.id)
  }, [cityId, cityQuery, filteredCities])

  useEffect(() => {
    setPage(1)
  }, [cityId, cityQuery])

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['casas-habitaciones', cityId || 'all', cityQuery, page],
    queryFn: () =>
      resourceService.getResourcesPage({
        cityId: cityId || undefined,
        cityIds: cityIdsFilter,
        category: 'habitaciones_escort',
        limit: CASAS_PAGE_SIZE,
        offset: (page - 1) * CASAS_PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  })

  const habitaciones = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / CASAS_PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const goToPage = (next: number) => {
    setPage(next)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-2">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          Casas y habitaciones
        </h1>
        <p className="page-subtitle mt-1.5">
          Filtra por ciudad, guarda favoritas y deja tu reseña. Solo para miembros de la comunidad.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card/90 p-3 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value)
              if (cityId) setCityId('')
            }}
            placeholder="Buscar ciudad…"
            className="pl-9"
            aria-label="Buscar ciudad"
          />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Ciudad
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Button
              type="button"
              size="sm"
              variant={cityId === '' && !cityQuery ? 'accent' : 'outline'}
              className="shrink-0 rounded-lg"
              onClick={() => {
                setCityId('')
                setCitySearch('')
              }}
            >
              Todas
            </Button>
            {filteredCities.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={cityId === c.id ? 'accent' : 'outline'}
                className="shrink-0 rounded-lg"
                onClick={() => {
                  setCityId(c.id === cityId ? '' : c.id)
                  setCitySearch('')
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
          {cityQuery && filteredCities.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              No hay ciudades que coincidan con “{citySearch.trim()}”.
            </p>
          )}
        </div>
      </div>

      <section ref={listRef} className="scroll-mt-20 space-y-4" aria-label="Listado de casas">
        {isError && (
          <ErrorState
            title="No se pudieron cargar las casas"
            onRetry={() => void refetch()}
          />
        )}

        {(isLoading && habitaciones.length === 0) && (
          <div className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && !isError && habitaciones.length === 0 && (
          <EmptyState
            icon={Home}
            title="Sin habitaciones"
            description="No hay casas o habitaciones publicadas con ese filtro."
          />
        )}

        {!isError && habitaciones.length > 0 && (
          <div className={`space-y-4 ${isFetching && !isLoading ? 'opacity-70' : ''}`}>
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
              {total > 0 ? ` · ${total} publicación${total !== 1 ? 'es' : ''}` : ''}
            </p>
            <ul className="space-y-4">
              {habitaciones.map((h) => (
                <li key={h.id}>
                  <HabitacionCard
                    habitacion={h}
                    detailTo={`/casas/${h.id}`}
                    showFavorite
                  />
                </li>
              ))}
            </ul>
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
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={p === page ? 'accent' : 'outline'}
                    className="habitacion-page-btn min-w-9"
                    onClick={() => goToPage(p)}
                    aria-label={`Página ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="habitacion-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
