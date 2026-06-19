import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { alertService } from '@/services/alert.service'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MyAlertsPage() {
  const { profile } = useAuth()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['my-alerts', profile?.id],
    queryFn: () => alertService.getMyAlerts(profile!.id),
    enabled: !!profile?.id,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis alertas</h1>
        <p className="text-muted-foreground">Historial de alertas que has reportado.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No has reportado alertas"
          description="Cuando reportes una situación, aparecerá aquí con su estado de revisión."
          action={
            <Link to="/alerts/new">
              <Button variant="destructive">Reportar alerta</Button>
            </Link>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} showStatus />
        ))}
      </div>
    </div>
  )
}
