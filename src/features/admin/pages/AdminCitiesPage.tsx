import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { CityRow } from '@/features/admin/components/CityRow'
import { CityForm } from '@/features/admin/components/CityForm'
import { cityService } from '@/services/city.service'
import type { AdminCity } from '@/types/admin'

export function AdminCitiesPage() {
  const [editingCity, setEditingCity] = useState<AdminCity | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: () => cityService.getAllCities(),
  })

  const showForm = showCreate || editingCity

  return (
    <div className="space-y-4">
      {showForm && (
        <CityForm
          city={editingCity}
          onClose={() => {
            setEditingCity(null)
            setShowCreate(false)
          }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ciudades ({cities.length})</CardTitle>
          {!showForm && (
            <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nueva ciudad
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!isLoading && cities.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="Sin ciudades"
              description="Crea la primera ciudad de la plataforma."
            />
          )}

          {cities.map((city) => (
            <CityRow
              key={city.id}
              city={city}
              onEdit={(c) => {
                setShowCreate(false)
                setEditingCity(c)
              }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
