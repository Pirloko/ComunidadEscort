import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { ResourceCategoryChips } from '@/features/resources/components/ResourceCategoryChips'
import { useCity } from '@/features/cities/context/CityContext'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { resourceService } from '@/services/resource.service'
import type { ResourceCategory } from '@/types/database'
import { BookOpen } from 'lucide-react'

export function ResourcesPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { selectedCity, selectedCityId } = useCity()
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all')
  const [localSearch, setLocalSearch] = useState('')
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  const { data: resources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['resources', selectedCityId, category, localSearch],
    queryFn: () =>
      resourceService.getResources({
        cityId: selectedCityId!,
        category: category === 'all' ? undefined : category,
        search: localSearch || undefined,
      }),
    enabled: !!selectedCityId,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Datos de todo</h1>
          <p className="text-muted-foreground">
            Servicios de confianza verificados por la comunidad
            {selectedCity ? ` en ${selectedCity.name}` : ''}.
          </p>
        </div>
        {isMod && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/resources/mine')}>
              Mis datos
            </Button>
            <Button variant="accent" className="gap-2" onClick={() => navigate('/resources/new')}>
              <Plus className="h-4 w-4" />
              Agregar dato
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar servicio..."
            className="pl-9"
          />
        </div>
        <ResourceCategoryChips selected={category} onSelect={setCategory} />
        <p className="text-sm text-muted-foreground">
          {resources.length} servicio{resources.length !== 1 ? 's' : ''} encontrado
          {resources.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && resources.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Sin datos en esta ciudad"
          description={
            isMod
              ? 'Agrega el primer dato verificado de esta ciudad.'
              : 'Todavía no hay datos verificados en esta ciudad.'
          }
          action={
            isMod ? (
              <Button variant="accent" onClick={() => navigate('/resources/new')}>
                Agregar dato
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  )
}
