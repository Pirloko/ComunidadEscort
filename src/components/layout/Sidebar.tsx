import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  MessageSquare,
  ShieldAlert,
  MapPin,
  User,
  Shield,
  HelpCircle,
  MessageCircle,
  Settings2,
  Bookmark,
  Users,
  BedDouble,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { moderationService } from '@/services/moderation.service'
import { adminService } from '@/services/admin.service'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { to: '/feed', label: 'Inicio', icon: Home },
  { to: '/forum', label: 'Foro', icon: MessageSquare },
  { to: '/alerts', label: 'Alertas', icon: ShieldAlert },
  { to: '/casas', label: 'Casas', icon: BedDouble },
  { to: '/chat', label: 'Chat', icon: MessageCircle, match: '/chat' },
  { to: '/members', label: 'Miembros', icon: Users, match: '/members' },
  { to: '/bookmarks', label: 'Guardados', icon: Bookmark, match: '/bookmarks' },
  { to: '/profile/edit', label: 'Perfil', icon: User, match: '/profile' },
]

export function Sidebar() {
  const location = useLocation()
  const { profile } = useAuth()
  const { cities, selectedCityId, setSelectedCityId } = useCity()

  const isActive = (to: string, match?: string) => {
    const path = match ?? to
    return location.pathname === to || location.pathname.startsWith(path + '/')
  }

  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-alerts-count'],
    queryFn: () => moderationService.getPendingAlertsCount(),
    enabled: isModerator,
    refetchInterval: 60000,
  })

  const { data: pendingUsersCount = 0 } = useQuery({
    queryKey: ['admin-pending-users-count'],
    queryFn: () => adminService.getPendingUsersCount(),
    enabled: isAdmin,
    refetchInterval: 30000,
  })

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-14 items-center border-b px-3">
        <BrandLogo size="md" to="/feed" className="h-11 max-w-[220px]" />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="eyebrow mb-2 px-3 text-muted-foreground">
          Comunidad
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => (
            <li key={to}>
              <Link
                  to={to === '/profile/edit' && profile ? `/profile/${profile.alias}` : to}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(to, match)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
            </li>
          ))}
          {isModerator && (
            <li>
              <Link
                to="/moderation"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname.startsWith('/moderation')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <Shield className="h-4 w-4" />
                Moderación
                {pendingCount > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <Settings2 className="h-4 w-4" />
                Administración
                {pendingUsersCount > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
                  </span>
                )}
              </Link>
            </li>
          )}
        </ul>

        <p className="eyebrow mb-2 mt-6 px-3 text-muted-foreground">
          Ciudades
        </p>
        <ul className="space-y-0.5">
          {cities.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => setSelectedCityId(city.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  selectedCityId === city.id
                    ? 'bg-accent/10 font-medium text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{city.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t p-3">
        <div className="rounded-xl bg-accent/10 p-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-medium">¿Necesitas ayuda?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Habla con una moderadora en cualquier momento.
              </p>
            </div>
          </div>
          <Button variant="accent" size="sm" className="mt-3 w-full" disabled>
            Contactar soporte
          </Button>
        </div>
      </div>
    </aside>
  )
}
