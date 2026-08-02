import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Home, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { CASAS_PAGE_SIZE } from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

type RecibeFilter = 'todos' | 'mujer' | 'hombre' | 'trans'

const RECIBE_OPTIONS: { id: RecibeFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'mujer', label: 'Mujeres' },
  { id: 'trans', label: 'Trans' },
  { id: 'hombre', label: 'Hombre' },
]

export function CasasPage() {
  const [recibe, setRecibe] = useState<RecibeFilter>('todos')
  const [soloParejas, setSoloParejas] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLElement>(null)

  const searchQuery = search.trim()

  useEffect(() => {
    setPage(1)
  }, [recibe, soloParejas, searchQuery])

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['casas-habitaciones', recibe, soloParejas, searchQuery, page],
    queryFn: () =>
      resourceService.getResourcesPage({
        category: 'habitaciones_escort',
        search: searchQuery || undefined,
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
          Filtra por quién recibe la casa, guarda favoritas y deja tu reseña. Solo para
          miembros de la comunidad.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card/90 p-3 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar casa…"
            className="pl-9"
            aria-label="Buscar casa"
          />
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
