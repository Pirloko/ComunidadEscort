import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cityService } from '@/services/city.service'
import type { AdminCity } from '@/types/admin'

interface CityRowProps {
  city: AdminCity
  onEdit: (city: AdminCity) => void
}

export function CityRow({ city, onEdit }: CityRowProps) {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      cityService.updateCity(city.id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    },
  })

  const region = city.region
  const regionName = Array.isArray(region) ? region[0]?.name : region?.name

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{city.name}</span>
          <Badge variant="outline">{city.slug}</Badge>
          {!city.is_active && (
            <Badge variant="outline" className="text-destructive">
              Inactiva
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{regionName ?? '—'}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={city.is_active}
            disabled={toggleMutation.isPending}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
          <span className="text-muted-foreground">Activa</span>
        </label>
        <Button variant="outline" size="sm" onClick={() => onEdit(city)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
