import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CityBadgeProps {
  cityName: string
  className?: string
}

export function CityBadge({ cityName, className }: CityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary',
        className,
      )}
    >
      <MapPin className="h-3 w-3" />
      {cityName}
    </span>
  )
}
