import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  className?: string
  /** Permite 0 estrellas (clic de nuevo en la estrella activa la baja a 0) */
  allowZero?: boolean
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
  allowZero = false,
}: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  const interactive = !!onChange

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="group" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => {
            if (!onChange) return
            if (allowZero && star === value) onChange(0)
            else onChange(star)
          }}
          className={cn(!interactive && 'cursor-default')}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          aria-pressed={star <= Math.round(value)}
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
      {interactive && allowZero && (
        <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
          {value}/5
        </span>
      )}
    </div>
  )
}
