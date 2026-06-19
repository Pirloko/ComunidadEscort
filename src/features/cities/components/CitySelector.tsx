import { MapPin } from 'lucide-react'
import { useCity } from '@/features/cities/context/CityContext'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CitySelectorProps {
  className?: string
}

export function CitySelector({ className }: CitySelectorProps) {
  const { cities, selectedCityId, setSelectedCityId, isLoading } = useCity()

  if (isLoading) {
    return <Skeleton className={cn('h-9 w-40', className)} />
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <MapPin className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <select
        value={selectedCityId ?? ''}
        onChange={(e) => setSelectedCityId(e.target.value)}
        className="h-9 appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Seleccionar ciudad"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  )
}
