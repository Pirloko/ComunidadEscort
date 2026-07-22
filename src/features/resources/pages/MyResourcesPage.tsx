import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { resourceService } from '@/services/resource.service'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MyResourcesPage() {
  const { profile } = useAuth()

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['my-resources', profile?.id],
    queryFn: () => resourceService.getMyResources(profile!.id),
    enabled: !!profile?.id,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Datos que he publicado</h1>
        <p className="text-muted-foreground">
          Entradas de Datos de todo que has publicado como moderadora o admin.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {!isLoading && resources.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No has publicado datos"
          description="Cuando agregues un dato a Datos de todo, aparecerá aquí."
          action={
            <Link to="/resources/new">
              <Button variant="accent">Agregar dato</Button>
            </Link>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} showStatus />
        ))}
      </div>
    </div>
  )
}
