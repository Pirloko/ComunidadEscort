import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, MapPin, Home } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

const TABS = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/cities', label: 'Ciudades', icon: MapPin },
  { to: '/admin/casas', label: 'Casas', icon: Home },
]

export function AdminLayout() {
  const { data: pendingUsersCount = 0 } = useQuery({
    queryKey: ['admin-pending-users-count'],
    queryFn: () => adminService.getPendingUsersCount(),
    refetchInterval: 30000,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Panel de administración</h1>
        <p className="text-muted-foreground">
          Gestiona usuarios, ciudades y casas/habitaciones para escort.
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {TABS.map(({ to, label, icon: Icon, end }) => (
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
            {to === '/admin/users' && pendingUsersCount > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
