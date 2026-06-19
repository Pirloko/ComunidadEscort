import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResourceCategoryBadge } from '@/features/resources/components/ResourceCategoryBadge'
import { formatRelativeTime } from '@/lib/format'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'

interface ResourceVerifyRowProps {
  resource: Resource
}

export function ResourceVerifyRow({ resource }: ResourceVerifyRowProps) {
  const queryClient = useQueryClient()

  const verifyMutation = useMutation({
    mutationFn: () =>
      resourceService.updateResource(resource.id, { is_verified: !resource.is_verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-unverified-count'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      resourceService.updateResource(resource.id, { is_active: !resource.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  const isPending = verifyMutation.isPending || toggleActiveMutation.isPending

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ResourceCategoryBadge category={resource.category} />
          {resource.is_verified ? (
            <Badge className="bg-success/20 text-success">Verificado</Badge>
          ) : (
            <Badge variant="outline" className="text-destructive">
              Sin verificar
            </Badge>
          )}
          {!resource.is_active && (
            <Badge variant="outline" className="text-muted-foreground">
              Inactivo
            </Badge>
          )}
        </div>
        <p className="mt-1 font-semibold">{resource.name}</p>
        {resource.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          @{resource.author?.alias ?? '—'} · {resource.city?.name} ·{' '}
          {formatRelativeTime(resource.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/resources/${resource.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Ver
          </Link>
        </Button>
        <Button
          size="sm"
          className={resource.is_verified ? '' : 'bg-success hover:bg-success/90'}
          onClick={() => verifyMutation.mutate()}
          disabled={isPending}
        >
          <Check className="h-3.5 w-3.5" />
          {resource.is_verified ? 'Quitar verificación' : 'Verificar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleActiveMutation.mutate()}
          disabled={isPending}
        >
          {resource.is_active ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    </div>
  )
}
