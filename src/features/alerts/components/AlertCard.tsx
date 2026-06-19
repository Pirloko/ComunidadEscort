import { Link } from 'react-router-dom'
import { MapPin, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { AlertStatusBadge } from '@/features/alerts/components/AlertStatusBadge'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { formatRelativeTime, truncateText } from '@/lib/format'
import type { Alert } from '@/types/alerts'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  alert: Alert
  showStatus?: boolean
}

const CATEGORY_ICON_COLORS: Record<string, string> = {
  estafa: 'bg-red-100 text-red-600',
  robo: 'bg-red-100 text-red-600',
  incidente_seguridad: 'bg-orange-100 text-orange-600',
  advertencia: 'bg-amber-100 text-amber-600',
  otro: 'bg-slate-100 text-slate-600',
}

export function AlertCard({ alert, showStatus = false }: AlertCardProps) {
  const iconColor = CATEGORY_ICON_COLORS[alert.category] ?? CATEGORY_ICON_COLORS.otro

  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10">
        <BookmarkButton itemType="alert" itemId={alert.id} size="sm" />
      </div>
      <Link to={`/alerts/${alert.id}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconColor)}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <AlertCategoryBadge category={alert.category} />
                {showStatus && <AlertStatusBadge status={alert.status} />}
              </div>

              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                {alert.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {alert.city.name}
                  </span>
                )}
                <span>·</span>
                <span>{formatRelativeTime(alert.created_at)}</span>
              </div>

              <h3 className="mt-2 font-semibold leading-snug">{alert.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {truncateText(alert.description, 140)}
              </p>

              {alert.location_detail && (
                <p className="mt-2 text-xs text-muted-foreground">
                  📍 {alert.location_detail}
                </p>
              )}

              {alert.author && alert.status === 'aprobada' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Por @{alert.author.alias}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
