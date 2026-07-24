import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { StarRating } from '@/components/shared/StarRating'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'
import { cn } from '@/lib/utils'

export function CasasPage() {
  const { cities } = useCity()
  /** Por defecto: todas las ciudades (no la del perfil / selector global) */
  const [cityId, setCityId] = useState('')
  const [citySearch, setCitySearch] = useState('')

  const cityQuery = citySearch.trim().toLowerCase()

  const filteredCities = useMemo(() => {
    if (!cityQuery) return cities
    return cities.filter((c) => c.name.toLowerCase().includes(cityQuery))
  }, [cities, cityQuery])

  const { data: allHabitaciones = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['casas-habitaciones', cityId || 'all'],
    queryFn: () =>
      resourceService.getResources({
        cityId: cityId || undefined,
        category: 'habitaciones_escort',
      }),
  })

  const habitaciones = useMemo(() => {
    if (cityId || !cityQuery) return allHabitaciones
    return allHabitaciones.filter((h) =>
      (h.city?.name ?? '').toLowerCase().includes(cityQuery),
    )
  }, [allHabitaciones, cityId, cityQuery])

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          Casas y habitaciones
        </h1>
        <p className="page-subtitle mt-1.5">
          Filtra por ciudad, revisa el hospedaje y deja tu reseña. Solo visible para
          miembros de la comunidad.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value)
              // Al buscar por texto, volver a “Todas” para no mezclar filtros
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
              className="shrink-0"
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
                className="shrink-0"
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

      {isError && (
        <ErrorState
          title="No se pudieron cargar las casas"
          onRetry={() => void refetch()}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      )}

      {!isLoading && !isError && habitaciones.length === 0 && (
        <EmptyState
          icon={Home}
          title="Sin habitaciones"
          description="No hay casas o habitaciones publicadas con ese filtro."
        />
      )}

      {!isLoading && habitaciones.length > 0 && (
        <ul className="space-y-3">
          {habitaciones.map((h) => (
            <li key={h.id}>
              <Link
                to={`/casas/${h.id}`}
                className={cn(
                  'flex gap-3 rounded-xl border bg-card p-3 transition-opacity active:opacity-90',
                )}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {h.photos?.[0]?.url ? (
                    <img
                      src={h.photos[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{h.name}</p>
                  {h.city && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {h.city.name}
                    </p>
                  )}
                  {h.reviews_count > 0 ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <StarRating value={h.rating_avg ?? 0} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {h.rating_avg} ({h.reviews_count})
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">Sin reseñas aún</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
