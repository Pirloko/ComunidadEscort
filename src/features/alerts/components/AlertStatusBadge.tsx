import { cn } from '@/lib/utils'
import type { AlertStatus } from '@/types/database'
import { ALERT_STATUS_COLORS, ALERT_STATUS_LABELS } from '@/lib/alerts'

interface AlertStatusBadgeProps {
  status: AlertStatus
  className?: string
}

export function AlertStatusBadge({ status, className }: AlertStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ALERT_STATUS_COLORS[status],
        className,
      )}
    >
      {ALERT_STATUS_LABELS[status]}
    </span>
  )
}
