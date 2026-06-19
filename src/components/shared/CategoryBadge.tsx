import { cn } from '@/lib/utils'
import type { PostCategory } from '@/types/database'
import { getCategoryLabel, CATEGORY_COLORS } from '@/lib/forum'

interface CategoryBadgeProps {
  category: PostCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        CATEGORY_COLORS[category],
        className,
      )}
    >
      {getCategoryLabel(category)}
    </span>
  )
}
