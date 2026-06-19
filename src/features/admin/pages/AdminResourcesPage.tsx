import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ResourceVerifyRow } from '@/features/admin/components/ResourceVerifyRow'
import { resourceService } from '@/services/resource.service'
import { cn } from '@/lib/utils'

export function AdminResourcesPage() {
  const [search, setSearch] = useState('')
  const [onlyUnverified, setOnlyUnverified] = useState(true)

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['admin-resources', search, onlyUnverified],
    queryFn: () =>
      resourceService.getAllResourcesForAdmin({
        search: search || undefined,
        onlyUnverified,
        limit: 50,
      }),
  })

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Recursos del directorio</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="max-w-md"
          />
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(onlyUnverified && 'bg-card shadow-sm')}
              onClick={() => setOnlyUnverified(true)}
            >
              Sin verificar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(!onlyUnverified && 'bg-card shadow-sm')}
              onClick={() => setOnlyUnverified(false)}
            >
              Todos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && resources.length === 0 && (
          <EmptyState
            icon={Building2}
            title={onlyUnverified ? 'Sin recursos pendientes' : 'Sin recursos'}
            description={
              onlyUnverified
                ? 'Todos los recursos activos están verificados.'
                : 'No hay recursos que coincidan con la búsqueda.'
            }
          />
        )}

        {resources.map((resource) => (
          <ResourceVerifyRow key={resource.id} resource={resource} />
        ))}
      </CardContent>
    </Card>
  )
}
