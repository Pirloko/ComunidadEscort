import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShieldAlert, MessageSquare, MessageCircle, MapPin, Flag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { moderationService } from '@/services/moderation.service'

const TABS = [
  { to: '/moderation', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/moderation/alerts', label: 'Alertas', icon: ShieldAlert, countKey: 'alerts' as const },
  { to: '/moderation/resources', label: 'Datos de todo', icon: MapPin, countKey: 'resources' as const },
  { to: '/moderation/reports', label: 'Reportes', icon: Flag, countKey: 'reports' as const },
  { to: '/moderation/posts', label: 'Publicaciones', icon: MessageSquare },
  { to: '/moderation/comments', label: 'Comentarios', icon: MessageCircle },
]

export function ModerationLayout() {
  const { data: pendingAlerts = 0 } = useQuery({
    queryKey: ['pending-alerts-count'],
    queryFn: () => moderationService.getPendingAlertsCount(),
    refetchInterval: 30000,
  })

  const { data: pendingResources = 0 } = useQuery({
    queryKey: ['pending-resources-count'],
    queryFn: () => moderationService.getPendingResourcesCount(),
    refetchInterval: 30000,
  })

  const { data: pendingReports = 0 } = useQuery({
    queryKey: ['pending-reports-count'],
    queryFn: () => moderationService.getPendingReportsCount(),
    refetchInterval: 30000,
  })

  const pendingCounts = { alerts: pendingAlerts, resources: pendingResources, reports: pendingReports }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de moderación</h1>
        <p className="text-muted-foreground">
          Gestiona alertas, Datos de todo, publicaciones y comentarios de la comunidad.
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {TABS.map(({ to, label, icon: Icon, end, countKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {countKey && pendingCounts[countKey] > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCounts[countKey] > 9 ? '9+' : pendingCounts[countKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
