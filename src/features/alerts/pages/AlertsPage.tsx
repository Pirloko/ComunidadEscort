import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Filter, ShieldAlert, MapPin, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { useCity } from '@/features/cities/context/CityContext'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { alertService } from '@/services/alert.service'

export function AlertsPage() {
  const { profile } = useAuth()
  const { cities } = useCity()
  const [filterCityId, setFilterCityId] = useState<string>('all')
  const [clientPhone, setClientPhone] = useState('')

  const phoneDigits = clientPhone.replace(/[^\d]/g, '')
  const phoneSearchActive = phoneDigits.length >= 4

  const { data: alerts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['alerts', filterCityId, phoneDigits],
    queryFn: () =>
      alertService.getApprovedAlerts({
        cityId: filterCityId === 'all' ? undefined : filterCityId,
        clientPhone: phoneSearchActive ? phoneDigits : undefined,
      }),
  })

  const { data: myPending = [] } = useQuery({
    queryKey: ['my-alerts', profile?.id],
    queryFn: () => alertService.getMyAlerts(profile!.id),
    enabled: !!profile?.id,
    select: (data) => data.filter((a) => a.status === 'pendiente'),
  })

  const phoneStats = useMemo(() => {
    if (!phoneSearchActive) return null
    const funas = alerts.filter((a) => a.report_kind !== 'recomendar').length
    const recoms = alerts.filter((a) => a.report_kind === 'recomendar').length
    return { total: alerts.length, funas, recoms }
  }, [alerts, phoneSearchActive])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reportes de clientes</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Consulta funas y recomendaciones verificadas. Busca por celular para ver cuántos
          reportes tiene un cliente antes de atenderlo.
        </p>
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

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
        </div>

        <label className="relative block">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Buscar por número de celular…"
            inputMode="tel"
            autoComplete="tel"
            className="pl-9"
            aria-label="Buscar por número de celular del cliente"
          />
        </label>
        {clientPhone && phoneDigits.length > 0 && phoneDigits.length < 4 && (
          <p className="text-xs text-muted-foreground">Escribe al menos 4 dígitos para buscar.</p>
        )}

        <label className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={filterCityId}
            onChange={(e) => setFilterCityId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filtrar por ciudad"
          >
            <option value="all">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {phoneStats ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{phoneStats.total}</span> reporte
            {phoneStats.total !== 1 ? 's' : ''} para este número
            {phoneStats.total > 0 && (
              <>
                {' '}
                (
                {phoneStats.funas} funa{phoneStats.funas !== 1 ? 's' : ''}
                {', '}
                {phoneStats.recoms} recomendación
                {phoneStats.recoms !== 1 ? 'es' : ''})
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {alerts.length} resultado{alerts.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && alerts.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title={phoneSearchActive ? 'Sin reportes para ese número' : 'Sin reportes aprobados'}
          description={
            phoneSearchActive
              ? 'No hay funas ni recomendaciones verificadas con ese celular.'
              : filterCityId === 'all'
                ? 'No hay funas ni recomendaciones verificadas todavía.'
                : 'No hay reportes verificados en esta ciudad. Prueba “Todas las ciudades”.'
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
