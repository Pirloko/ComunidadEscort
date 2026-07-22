import { Home, MessageSquare, ShieldAlert, MessageCircle, User, Shield, Settings2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { moderationService } from '@/services/moderation.service'
import { adminService } from '@/services/admin.service'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  dynamic?: boolean
  badge?: number
}

const ITEMS: NavItem[] = [
  { to: '/feed', icon: Home, label: 'Inicio' },
  { to: '/forum', icon: MessageSquare, label: 'Foro' },
  { to: '/alerts', icon: ShieldAlert, label: 'Alertas' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile/edit', icon: User, label: 'Perfil', dynamic: true },
]

export function MobileNav() {
  const location = useLocation()
  const { profile } = useAuth()
  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-alerts-count'],
    queryFn: () => moderationService.getPendingAlertsCount(),
    enabled: isModerator && !isAdmin,
    refetchInterval: 60000,
  })

  const { data: pendingUsersCount = 0 } = useQuery({
    queryKey: ['admin-pending-users-count'],
    queryFn: () => adminService.getPendingUsersCount(),
    enabled: isAdmin,
    refetchInterval: 30000,
  })

  let items: NavItem[] = ITEMS

  if (isAdmin) {
    items = [
      ...ITEMS.slice(0, 3),
      { to: '/admin', icon: Settings2, label: 'Admin', badge: pendingUsersCount },
      ...ITEMS.slice(3),
    ]
  } else if (isModerator) {
    items = [
      ...ITEMS.slice(0, 3),
      { to: '/moderation', icon: Shield, label: 'Mod', badge: pendingCount },
      ...ITEMS.slice(3),
    ]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-sm lg:hidden">
      {items.map(({ to, icon: Icon, label, dynamic, badge }) => {
        const href = dynamic && profile ? `/profile/${profile.alias}` : to
        const active =
          location.pathname === href ||
          location.pathname.startsWith(to + '/') ||
          (to === '/profile/edit' && location.pathname.startsWith('/profile/'))
        return (
          <Link
            key={to}
            to={href}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-[11px] leading-tight',
              active ? 'text-accent' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute right-[calc(50%-18px)] top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
