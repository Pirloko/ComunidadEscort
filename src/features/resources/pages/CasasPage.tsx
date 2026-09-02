import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Home, MapPin, Plus, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { CASAS_PAGE_SIZE } from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'
import type { City } from '@/types/database'
import '@/features/home/home-landing.css'

type RecibeFilter = 'todos' | 'mujer' | 'hombre' | 'trans'

const RECIBE_OPTIONS: { id: RecibeFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'mujer', label: 'Mujeres' },
  { id: 'trans', label: 'Trans' },
  { id: 'hombre', label: 'Hombre' },
]

export function CasasPage() {
  const { profile } = useAuth()
  const { cities } = useCity()
  const canCreateCasa = profile?.role === 'admin' || profile?.role === 'moderator'

  const [recibe, setRecibe] = useState<RecibeFilter>('todos')
  const [soloParejas, setSoloParejas] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [cityMenuOpen, setCityMenuOpen] = useState(false)
  const [pageByFilter, setPageByFilter] = useState<Record<string, number>>({})
  const listRef = useRef<HTMLElement>(null)
  const cityBoxRef = useRef<HTMLDivElement>(null)

  const filterKey = `${recibe}|${soloParejas}|${selectedCity?.id ?? ''}`
  const page = pageByFilter[filterKey] ?? 1

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase()
    if (!q || selectedCity) return []
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [cities, cityQuery, selectedCity])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!cityBoxRef.current?.contains(e.target as Node)) {
        setCityMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['casas-habitaciones', recibe, soloParejas, selectedCity?.id, page],
    queryFn: () =>
      resourceService.getResourcesPage({
        category: 'habitaciones_escort',
        cityId: selectedCity?.id,
        recibe_mujer: recibe === 'mujer' ? true : undefined,
        recibe_hombre: recibe === 'hombre' ? true : undefined,
        recibe_trans: recibe === 'trans' ? true : undefined,
        acepta_parejas: soloParejas ? true : undefined,
        limit: CASAS_PAGE_SIZE,
        offset: (page - 1) * CASAS_PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  })

  const habitaciones = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / CASAS_PAGE_SIZE))
  const queryPage = Math.min(Math.max(1, page), totalPages)

  const setPage = (next: number) => {
    setPageByFilter((prev) => ({ ...prev, [filterKey]: next }))
  }

  const goToPage = (next: number) => {
    setPage(next)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearCity = () => {
    setSelectedCity(null)
    setCityQuery('')
    setCityMenuOpen(false)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Casas y habitaciones
          </h1>
          <p className="page-subtitle mt-1.5">
            Filtra por ciudad y quién recibe la casa, guarda favoritas y deja tu reseña.
          </p>
        </div>
        {canCreateCasa && (
          <Button asChild size="sm" className="shrink-0 gap-1">
            <Link to="/casas/new">
              <Plus className="h-4 w-4" />
              Nueva
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-3 rounded-xl border bg-card/90 p-3 backdrop-blur-sm">
        <div ref={cityBoxRef} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={selectedCity ? selectedCity.name : cityQuery}
            onChange={(e) => {
              setSelectedCity(null)
              setCityQuery(e.target.value)
              setCityMenuOpen(true)
            }}
            onFocus={() => setCityMenuOpen(true)}
            placeholder="Buscar por ciudad…"
            className="pl-9 pr-9"
            aria-label="Buscar por ciudad"
            aria-autocomplete="list"
            aria-expanded={cityMenuOpen && citySuggestions.length > 0}
          />
          {(selectedCity || cityQuery) && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={clearCity}
              aria-label="Limpiar ciudad"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {cityMenuOpen && citySuggestions.length > 0 && (
            <ul
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-md"
              role="listbox"
            >
              {citySuggestions.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setSelectedCity(city)
                      setCityQuery(city.name)
                      setCityMenuOpen(false)
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {city.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Recibe a
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {RECIBE_OPTIONS.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant={recibe === opt.id ? 'accent' : 'outline'}
                className="shrink-0 rounded-lg"
                onClick={() => setRecibe(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            Parejas
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Button
              type="button"
              size="sm"
              variant={!soloParejas ? 'accent' : 'outline'}
              className="shrink-0 rounded-lg"
              onClick={() => setSoloParejas(false)}
            >
              Todas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={soloParejas ? 'accent' : 'outline'}
              className="shrink-0 rounded-lg"
              onClick={() => setSoloParejas(true)}
            >
              Reciben pareja
            </Button>
          </div>
        </div>
      </div>

      <section ref={listRef} className="scroll-mt-20 space-y-4" aria-label="Listado de casas">
        {isError && (
          <ErrorState
            title="No se pudieron cargar las casas"
            onRetry={() => void refetch()}
          />
        )}

        {isLoading && habitaciones.length === 0 && (
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
              Página {queryPage} de {totalPages}
              {total > 0 ? ` · ${total} publicación${total !== 1 ? 'es' : ''}` : ''}
              {selectedCity ? ` · ${selectedCity.name}` : ''}
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
    </div>
  )
}
