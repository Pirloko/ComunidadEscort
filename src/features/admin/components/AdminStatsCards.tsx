import { Link } from 'react-router-dom'
import { Users, MapPin, Building2, ShieldAlert, UserCheck, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AdminStats } from '@/types/admin'

interface AdminStatsCardsProps {
  stats: AdminStats
  isLoading?: boolean
}

const CARDS = [
  {
    key: 'pendingUsers' as const,
    label: 'Cuentas pendientes',
    icon: Clock,
    color: 'text-destructive',
    href: '/admin/users?pending=1',
  },
  {
    key: 'totalUsers' as const,
    label: 'Usuarios totales',
    sub: 'activeUsers',
    subLabel: 'activos',
    icon: Users,
    color: 'text-primary',
    href: '/admin/users',
  },
  {
    key: 'moderators' as const,
    label: 'Mods y admins',
    icon: UserCheck,
    color: 'text-accent',
    href: '/admin/users',
  },
  {
    key: 'totalCities' as const,
    label: 'Ciudades',
    sub: 'activeCities',
    subLabel: 'activas',
    icon: MapPin,
    color: 'text-accent',
    href: '/admin/cities',
  },
  {
    key: 'unverifiedResources' as const,
    label: 'Recursos sin verificar',
    icon: Building2,
    color: 'text-destructive',
    href: '/admin/resources',
  },
  {
    key: 'totalResources' as const,
    label: 'Recursos totales',
    icon: Building2,
    color: 'text-muted-foreground',
    href: '/admin/resources',
  },
  {
    key: 'pendingAlerts' as const,
    label: 'Alertas pendientes',
    icon: ShieldAlert,
    color: 'text-destructive',
    href: '/moderation/alerts',
  },
]

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map(({ key, label, sub, subLabel, icon: Icon, color, href }) => (
        <Link key={key} to={href}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-muted p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? '…' : stats[key]}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
                {sub && !isLoading && (
                  <p className="text-xs text-muted-foreground">
                    {stats[sub as keyof AdminStats]} {subLabel}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
