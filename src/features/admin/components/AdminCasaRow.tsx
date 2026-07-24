import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'

interface AdminCasaRowProps {
  resource: Resource
}

export function AdminCasaRow({ resource }: AdminCasaRowProps) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-casas'] })
    queryClient.invalidateQueries({ queryKey: ['casas-habitaciones'] })
    queryClient.invalidateQueries({ queryKey: ['resources'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    queryClient.invalidateQueries({ queryKey: ['public-habitaciones'] })
    queryClient.invalidateQueries({ queryKey: ['public-habitacion-cities'] })
  }

  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      resourceService.updateResource(resource.id, { is_active: !resource.is_active }),
    onSuccess: invalidate,
  })

  const togglePublicMutation = useMutation({
    mutationFn: () =>
      resourceService.updateResource(resource.id, { is_public: !resource.is_public }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: () => resourceService.deleteResource(resource.id),
    onSuccess: invalidate,
  })

  const isPending =
    toggleActiveMutation.isPending ||
    togglePublicMutation.isPending ||
    deleteMutation.isPending

  const handleDelete = () => {
    if (
      !confirm(
        `¿Eliminar permanentemente «${resource.name}»? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {resource.is_active ? (
            <Badge className="bg-success/20 text-success">Activa</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Pausada
            </Badge>
          )}
          {resource.is_public ? (
            <Badge variant="secondary">Pública (/home)</Badge>
          ) : (
            <Badge variant="outline">Solo comunidad</Badge>
          )}
          {resource.is_verified && (
            <Badge className="bg-accent/20 text-accent">Verificada</Badge>
          )}
        </div>
        <p className="mt-1 font-semibold">{resource.name}</p>
        {resource.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {resource.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {resource.city?.name ?? 'Sin ciudad'} · {formatRelativeTime(resource.created_at)}
          {resource.reviews_count > 0 && (
            <> · ★ {resource.rating_avg} ({resource.reviews_count})</>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <Link
          to={`/casas/${resource.id}`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver
        </Link>
        <Link
          to={`/admin/casas/${resource.id}/edit`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => togglePublicMutation.mutate()}
          disabled={isPending}
        >
          {resource.is_public ? 'Ocultar de /home' : 'Publicar en /home'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleActiveMutation.mutate()}
          disabled={isPending}
        >
          {resource.is_active ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Reactivar
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>
    </div>
  )
}
