import { Link } from 'react-router-dom'
import { ShieldAlert, MessageSquare, MessageCircle, Pin, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ModerationStats } from '@/types/moderation'

interface ModerationStatsCardsProps {
  stats: ModerationStats
  isLoading?: boolean
}

const CARDS = [
  {
    key: 'pendingAlerts' as const,
    label: 'Alertas pendientes',
    icon: ShieldAlert,
    color: 'text-destructive',
    href: '/moderation/alerts',
  },
  {
    key: 'totalPosts' as const,
    label: 'Publicaciones',
    icon: MessageSquare,
    color: 'text-accent',
    href: '/moderation/posts',
  },
  {
    key: 'totalComments' as const,
    label: 'Comentarios',
    icon: MessageCircle,
    color: 'text-primary',
    href: '/moderation/comments',
  },
  {
    key: 'pinnedPosts' as const,
    label: 'Posts fijados',
    icon: Pin,
    color: 'text-accent',
    href: '/moderation/posts',
  },
  {
    key: 'lockedPosts' as const,
    label: 'Posts bloqueados',
    icon: Lock,
    color: 'text-muted-foreground',
    href: '/moderation/posts',
  },
  {
    key: 'approvedAlerts' as const,
    label: 'Alertas aprobadas',
    icon: ShieldAlert,
    color: 'text-success',
    href: '/alerts',
  },
]

export function ModerationStatsCards({ stats, isLoading }: ModerationStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map(({ key, label, icon: Icon, color, href }) => (
        <Link key={key} to={href}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-muted p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? '…' : stats[key]}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
