import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ResourceReviewModal } from '@/features/moderation/components/ResourceReviewModal'
import { ResourceCategoryBadge } from '@/features/resources/components/ResourceCategoryBadge'
import { formatRelativeTime } from '@/lib/format'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'

export function ModerationResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-resources'],
    queryFn: () => resourceService.getPendingResources(),
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recursos pendientes ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-40 w-full" />}

          {!isLoading && pending.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="Sin recursos pendientes"
              description="No hay entradas del directorio esperando revisión."
            />
          )}

          <ul className="divide-y">
            {pending.map((resource) => (
              <li
                key={resource.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ResourceCategoryBadge category={resource.category} />
                    <span className="text-xs text-muted-foreground">
                      {resource.city?.name} · {formatRelativeTime(resource.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{resource.name}</p>
                  {resource.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Por @{resource.author?.alias ?? '—'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedResource(resource)}
                >
                  Revisar
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ResourceReviewModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </>
  )
}
