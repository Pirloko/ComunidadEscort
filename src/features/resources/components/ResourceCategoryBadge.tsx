import { cn } from '@/lib/utils'
import type { ResourceCategory } from '@/types/database'
import { getResourceCategoryLabel, RESOURCE_CATEGORY_COLORS } from '@/lib/resources'

interface ResourceCategoryBadgeProps {
  category: ResourceCategory
  className?: string
}

export function ResourceCategoryBadge({ category, className }: ResourceCategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        RESOURCE_CATEGORY_COLORS[category],
        className,
      )}
    >
      {getResourceCategoryLabel(category)}
    </span>
  )
}
