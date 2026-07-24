import { Link } from 'react-router-dom'
import { MapPin, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { AlertStatusBadge } from '@/features/alerts/components/AlertStatusBadge'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { ReportButton } from '@/features/reports/components/ReportButton'
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime, truncateText } from '@/lib/format'
import { shareClienteAlertText } from '@/lib/share'
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
  const { user } = useAuth()
  const iconColor = CATEGORY_ICON_COLORS[alert.category] ?? CATEGORY_ICON_COLORS.otro
  const shareText =
    alert.status === 'aprobada'
      ? shareClienteAlertText({
          kind: alert.report_kind === 'recomendar' ? 'recomendar' : 'funar',
          title: alert.title,
          clientNumber: alert.client_number,
          path: `/alerts/${alert.id}`,
        })
      : null

  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10 flex">
        <BookmarkButton itemType="alert" itemId={alert.id} size="sm" />
        {user?.id !== alert.author_id && (
          <ReportButton targetType="alert" targetId={alert.id} size="sm" />
        )}
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
                {alert.report_kind === 'recomendar' && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                    Recomendación
                  </span>
                )}
                {alert.report_kind === 'funar' && (
                  <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Funa
                  </span>
                )}
                {showStatus && alert.status !== 'aprobada' && (
                  <AlertStatusBadge status={alert.status} />
                )}
              </div>

              <h3 className="card-title mt-2 leading-snug">{alert.title}</h3>
              {alert.client_number && (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Cliente: {alert.client_number}
                </p>
              )}
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {truncateText(alert.description, 140)}
              </p>

              {(alert.city || alert.city_other) && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {alert.city?.name ?? alert.city_other}
                  <span>·</span>
                  <span>{formatRelativeTime(alert.created_at)}</span>
                </p>
              )}
              {!alert.city && !alert.city_other && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatRelativeTime(alert.created_at)}
                </p>
              )}

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
      {shareText && (
        <div className="border-t px-3 py-2">
          <ShareWhatsAppButton
            size="sm"
            variant="ghost"
            label="Compartir con alguna amiga"
            className="h-8 w-full justify-start px-2 text-xs"
            text={shareText}
          />
        </div>
      )}
    </Card>
  )
}
