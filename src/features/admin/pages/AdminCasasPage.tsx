import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { AdminCasaRow } from '@/features/admin/components/AdminCasaRow'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'paused'

export function AdminCasasPage() {
  const { cities } = useCity()
  const [search, setSearch] = useState('')
  const [cityId, setCityId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const { data: casas = [], isLoading } = useQuery({
    queryKey: ['admin-casas', search, cityId, status],
    queryFn: () =>
      resourceService.getHabitacionesForAdmin({
        search: search || undefined,
        cityId: cityId || undefined,
        onlyActive: status === 'active' ? true : undefined,
        limit: 100,
      }),
  })

  const filtered =
    status === 'paused' ? casas.filter((c) => !c.is_active) : casas

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Casas y habitaciones</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Crear, editar, pausar o eliminar hospedajes para escort.
            </p>
          </div>
          <Link
            to="/admin/casas/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Nueva casa
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="max-w-md"
          />
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
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
                onClick={() => setStatus(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
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

        {filtered.map((casa) => (
          <AdminCasaRow key={casa.id} resource={casa} />
        ))}
      </CardContent>
    </Card>
  )
}
