import { cn } from '@/lib/utils'
import { POST_CATEGORIES } from '@/lib/forum'
import type { PostCategory } from '@/types/database'

interface CategorySidebarProps {
  selected: PostCategory | 'all'
  onSelect: (category: PostCategory | 'all') => void
  counts: Record<string, number>
}

export function CategorySidebar({ selected, onSelect, counts }: CategorySidebarProps) {
  return (
    <div className="space-y-1">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Categorías
      </p>
      {POST_CATEGORIES.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
            selected === value
              ? 'bg-accent/10 font-medium text-accent'
              : 'text-foreground hover:bg-muted',
          )}
        >
          <span className="flex items-center gap-2">
            <span>{icon}</span>
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{counts[value] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
