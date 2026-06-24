import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ModerationStatsCards } from '@/features/moderation/components/ModerationStatsCards'
import { useCity } from '@/features/cities/context/CityContext'
import { moderationService } from '@/services/moderation.service'
import { alertService } from '@/services/alert.service'
import { resourceService } from '@/services/resource.service'
import { formatRelativeTime } from '@/lib/format'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { ResourceCategoryBadge } from '@/features/resources/components/ResourceCategoryBadge'
import { MapPin } from 'lucide-react'

export function ModerationDashboardPage() {
  const { selectedCityId, selectedCity } = useCity()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['moderation-stats', selectedCityId],
    queryFn: () => moderationService.getStats(selectedCityId ?? undefined),
  })

  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-alerts'],
    queryFn: () => alertService.getPendingAlerts(),
  })

  const { data: pendingResources = [], isLoading: pendingResourcesLoading } = useQuery({
    queryKey: ['pending-resources'],
    queryFn: () => resourceService.getPendingResources(),
  })

  const recentPending = pending.slice(0, 3)
  const recentPendingResources = pendingResources.slice(0, 3)

  return (
    <div className="space-y-6">
      {selectedCity && (
        <p className="text-sm text-muted-foreground">
          Métricas filtradas por <span className="font-medium">{selectedCity.name}</span>
          {' '}(alertas pendientes son globales).
        </p>
      )}

      <ModerationStatsCards
        stats={
          stats ?? {
            pendingAlerts: 0,
            approvedAlerts: 0,
            totalPosts: 0,
            pinnedPosts: 0,
            lockedPosts: 0,
            totalComments: 0,
          }
        }
        isLoading={statsLoading}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Alertas pendientes recientes</CardTitle>
          {pending.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/moderation/alerts" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingLoading && <Skeleton className="h-24 w-full" />}

          {!pendingLoading && recentPending.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay alertas esperando revisión.
              </p>
            </div>
          )}

          <ul className="divide-y">
            {recentPending.map((alert) => (
              <li key={alert.id}>
                <Link
                  to="/moderation/alerts"
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertCategoryBadge category={alert.category} />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.city?.name} · @{alert.author?.alias ?? '—'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Datos pendientes recientes</CardTitle>
          {pendingResources.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/moderation/resources" className="gap-1">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingResourcesLoading && <Skeleton className="h-24 w-full" />}

          {!pendingResourcesLoading && recentPendingResources.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay datos esperando revisión.
              </p>
            </div>
          )}

          <ul className="divide-y">
            {recentPendingResources.map((resource) => (
              <li key={resource.id}>
                <Link
                  to="/moderation/resources"
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ResourceCategoryBadge category={resource.category} />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(resource.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium">{resource.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {resource.city?.name} · @{resource.author?.alias ?? '—'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
