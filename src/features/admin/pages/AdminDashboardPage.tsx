import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminStatsCards } from '@/features/admin/components/AdminStatsCards'
import { adminService } from '@/services/admin.service'
import { resourceService } from '@/services/resource.service'

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    refetchInterval: 60000,
  })

  const { data: unverified = [], isLoading: unverifiedLoading } = useQuery({
    queryKey: ['admin-resources', 'dashboard'],
    queryFn: () => resourceService.getUnverifiedResources(5),
  })

  return (
    <div className="space-y-6">
      <AdminStatsCards
        stats={
          stats ?? {
            totalUsers: 0,
            activeUsers: 0,
            pendingUsers: 0,
            moderators: 0,
            totalCities: 0,
            activeCities: 0,
            unverifiedResources: 0,
            totalResources: 0,
            pendingAlerts: 0,
          }
        }
        isLoading={isLoading}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recursos pendientes de verificación</CardTitle>
          {(stats?.unverifiedResources ?? 0) > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/resources" className="gap-1">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {unverifiedLoading && <Skeleton className="h-20 w-full" />}

          {!unverifiedLoading && unverified.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Todos los recursos están verificados.
              </p>
            </div>
          )}

          <ul className="divide-y">
            {unverified.map((r) => (
              <li key={r.id}>
                <Link
                  to="/admin/resources"
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.city?.name} · @{r.author?.alias ?? '—'}
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
