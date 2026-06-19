import { cn } from '@/lib/utils'
import type { AlertCategory } from '@/types/database'
import { getAlertCategoryLabel, ALERT_CATEGORY_COLORS } from '@/lib/alerts'

interface AlertCategoryBadgeProps {
  category: AlertCategory
  className?: string
}

export function AlertCategoryBadge({ category, className }: AlertCategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ALERT_CATEGORY_COLORS[category],
        className,
      )}
    >
      {getAlertCategoryLabel(category)}
    </span>
  )
}
