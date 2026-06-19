import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Filter, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { useSearch } from '@/components/layout/AppShell'
import { useCity } from '@/features/cities/context/CityContext'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { alertService } from '@/services/alert.service'
import { ALERT_CATEGORIES } from '@/lib/alerts'
import type { AlertCategory } from '@/types/database'

export function AlertsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { selectedCity, selectedCityId } = useCity()
  const { search } = useSearch()
  const [category, setCategory] = useState<AlertCategory | 'all'>('all')

  const { data: alerts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['alerts', selectedCityId, category, search],
    queryFn: () =>
      alertService.getApprovedAlerts({
        cityId: selectedCityId!,
        category: category === 'all' ? undefined : category,
        search: search || undefined,
      }),
    enabled: !!selectedCityId,
  })

  const { data: myPending = [] } = useQuery({
    queryKey: ['my-alerts', profile?.id],
    queryFn: () => alertService.getMyAlerts(profile!.id),
    enabled: !!profile?.id,
    select: (data) => data.filter((a) => a.status === 'pendiente'),
  })

  const categories = ALERT_CATEGORIES

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centro de alertas</h1>
          <p className="text-muted-foreground">
            Mantente al día con las alertas verificadas
            {selectedCity ? ` en ${selectedCity.name}` : ''}.
          </p>
        </div>
        <Button variant="destructive" className="gap-2" onClick={() => navigate('/alerts/new')}>
          <Plus className="h-4 w-4" />
          Reportar alerta
        </Button>
      </div>

      {myPending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Tienes {myPending.length} alerta{myPending.length > 1 ? 's' : ''} en revisión.
          </p>
          <Link to="/alerts/mine" className="mt-1 text-sm text-amber-700 underline dark:text-amber-300">
            Ver mis alertas
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AlertCategory | 'all')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {categories.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {alerts.length} resultado{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && alerts.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="Sin alertas aprobadas"
          description="No hay alertas verificadas en esta ciudad. Puedes reportar una situación."
          action={
            <Button variant="destructive" onClick={() => navigate('/alerts/new')}>
              Reportar alerta
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}
