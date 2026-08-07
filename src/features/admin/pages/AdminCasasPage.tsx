import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Home, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { AdminCasaRow } from '@/features/admin/components/AdminCasaRow'
import { ImportCasasCsvButton } from '@/features/admin/components/ImportCasasCsvButton'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'active' | 'paused'

const PAGE_SIZE = 10

export function AdminCasasPage() {
  const { cities } = useCity()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cityId, setCityId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['admin-casas-pending-count'],
    queryFn: async () => {
      const res = await resourceService.getHabitacionesForAdmin({
        reviewStatus: 'pendiente',
        page: 1,
        pageSize: 1,
      })
      return res.total
    },
    refetchInterval: 30000,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-casas', debouncedSearch, cityId, status, page],
    queryFn: () =>
      resourceService.getHabitacionesForAdmin({
        search: debouncedSearch || undefined,
        cityId: cityId || undefined,
        reviewStatus: status === 'pending' ? 'pendiente' : status === 'all' ? 'all' : 'aprobada',
        onlyActive: status === 'active' ? true : undefined,
        onlyPaused: status === 'paused' ? true : undefined,
        cities,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  })

  const casas = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Casas y habitaciones</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Crear, aprobar, editar, pausar o eliminar hospedajes para escort.
              {pendingCount > 0 && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="font-medium text-destructive underline-offset-2 hover:underline"
                    onClick={() => {
                      setStatus('pending')
                      setPage(1)
                    }}
                  >
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <ImportCasasCsvButton />
              <Link
                to="/admin/casas/new"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" />
                Nueva casa
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV con columnas de la plantilla (sin fotos; súbelas después).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, número o ciudad…"
            className="max-w-md"
            aria-label="Buscar casas"
          />
          <select
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filtrar por ciudad"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {(
              [
                ['all', 'Todas'],
                ['pending', 'Pendientes'],
                ['active', 'Activas'],
                ['paused', 'Pausadas'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant="ghost"
                className={cn(status === value && 'bg-card shadow-sm')}
                onClick={() => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                {label}
                {value === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </Button>
            ))}
          </div>
        </div>

        {!isLoading && total > 0 && (
          <p className="text-xs text-muted-foreground">
            {total} casa{total !== 1 ? 's' : ''} · página {page} de {totalPages}
            {isFetching ? ' · actualizando…' : ''}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && casas.length === 0 && (
          <EmptyState
            icon={Home}
            title="Sin casas"
            description="Aún no hay habitaciones con ese filtro. Crea la primera."
            action={
              <Link
                to="/admin/casas/new"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                Nueva casa
              </Link>
            }
          />
        )}

        {casas.map((casa) => (
          <AdminCasaRow key={casa.id} resource={casa} />
        ))}

        {!isLoading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t p-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                className="min-w-9"
                onClick={() => setPage(p)}
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
