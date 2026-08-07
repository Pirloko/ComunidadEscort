import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { publisherService } from '@/services/publisher.service'
import type { RecommendedPublisher } from '@/types/admin'

interface PublisherRowProps {
  publisher: RecommendedPublisher
  onEdit: (publisher: RecommendedPublisher) => void
}

export function PublisherRow({ publisher, onEdit }: PublisherRowProps) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-publishers'] })
    queryClient.invalidateQueries({ queryKey: ['recommended-publishers'] })
  }

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      publisherService.update(publisher.id, { is_active: isActive }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: () => publisherService.delete(publisher.id),
    onSuccess: invalidate,
  })

  const handleDelete = () => {
    if (
      !window.confirm(
        `¿Eliminar a «${publisher.name}»? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{publisher.name}</span>
          <Badge variant="outline">#{publisher.sort_order}</Badge>
          {!publisher.is_active && (
            <Badge variant="outline" className="text-destructive">
              Inactivo
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{publisher.whatsapp}</p>
        {publisher.note && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{publisher.note}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={publisher.is_active}
            disabled={toggleMutation.isPending}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
          <span className="text-muted-foreground">Activo</span>
        </label>
        <Button variant="outline" size="sm" onClick={() => onEdit(publisher)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
