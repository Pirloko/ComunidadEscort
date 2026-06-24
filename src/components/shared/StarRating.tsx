import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  className?: string
}

export function StarRating({ value, onChange, size = 'md', className }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  const interactive = !!onChange

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={cn(!interactive && 'cursor-default')}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClass,
              star <= Math.round(value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  )
}
