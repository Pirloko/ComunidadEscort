import { cn } from '@/lib/utils'
import { RESOURCE_CATEGORIES } from '@/lib/resources'
import type { ResourceCategory } from '@/types/database'

interface ResourceCategoryChipsProps {
  selected: ResourceCategory | 'all'
  onSelect: (category: ResourceCategory | 'all') => void
}

export function ResourceCategoryChips({ selected, onSelect }: ResourceCategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {RESOURCE_CATEGORIES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            selected === value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-card text-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
