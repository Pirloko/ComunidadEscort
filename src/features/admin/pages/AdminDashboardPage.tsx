import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const { data: casas = [], isLoading: casasLoading } = useQuery({
    queryKey: ['admin-casas', 'dashboard'],
    queryFn: () => resourceService.getHabitacionesForAdmin({ limit: 5 }),
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
            totalHabitaciones: 0,
            activeHabitaciones: 0,
            pendingAlerts: 0,
          }
        }
        isLoading={isLoading}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Casas recientes</CardTitle>
          <Link
            to="/admin/casas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {casasLoading && <Skeleton className="h-20 w-full" />}

          {!casasLoading && casas.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Home className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Aún no hay casas publicadas.</p>
              <Link
                to="/admin/casas/new"
                className="mt-3 text-sm font-medium text-accent hover:underline"
              >
                Crear la primera
              </Link>
            </div>
          )}

          <ul className="divide-y">
            {casas.map((r) => (
              <li key={r.id}>
                <Link
                  to="/admin/casas"
                  className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.city?.name ?? 'Sin ciudad'}
                      {!r.is_active ? ' · Pausada' : r.is_public ? ' · Pública' : ' · Solo comunidad'}
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
