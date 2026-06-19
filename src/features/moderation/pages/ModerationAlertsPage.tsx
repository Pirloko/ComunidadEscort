import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertReviewModal } from '@/features/moderation/components/AlertReviewModal'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { formatRelativeTime } from '@/lib/format'
import { alertService } from '@/services/alert.service'
import type { Alert } from '@/types/alerts'

export function ModerationAlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-alerts'],
    queryFn: () => alertService.getPendingAlerts(),
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Alertas pendientes ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-40 w-full" />}

          {!isLoading && pending.length === 0 && (
            <EmptyState
              icon={Shield}
              title="Sin alertas pendientes"
              description="No hay reportes esperando revisión."
            />
          )}

          <ul className="divide-y">
            {pending.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertCategoryBadge category={alert.category} />
                    <span className="text-xs text-muted-foreground">
                      {alert.city?.name} · {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{alert.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Por @{alert.author?.alias ?? 'anónima'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedAlert(alert)}
                >
                  Revisar
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertReviewModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </>
  )
}
