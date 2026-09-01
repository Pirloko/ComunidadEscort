import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { bannerService } from '@/services/banner.service'
import type { HomeBanner } from '@/types/admin'

interface BannerRowProps {
  banner: HomeBanner
  onEdit: (banner: HomeBanner) => void
}

export function BannerRow({ banner, onEdit }: BannerRowProps) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
    queryClient.invalidateQueries({ queryKey: ['home-banners'] })
  }

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => bannerService.update(banner.id, { is_active: isActive }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: () => bannerService.delete(banner.id),
    onSuccess: invalidate,
  })

  const handleDelete = () => {
    if (
      !window.confirm(`¿Eliminar el banner «${banner.title}»? Esta acción no se puede deshacer.`)
    ) {
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-14 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-muted">
          {banner.image_url ? (
            <img
              src={banner.image_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{banner.title}</span>
            <Badge variant="outline">#{banner.sort_order}</Badge>
            {!banner.is_active && (
              <Badge variant="outline" className="text-destructive">
                Inactivo
              </Badge>
            )}
          </div>
          {banner.link_url ? (
            <a
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 truncate text-xs text-primary hover:underline"
            >
              {banner.link_url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Sin enlace</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={banner.is_active}
            disabled={toggleMutation.isPending}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
          <span className="text-muted-foreground">Activo</span>
        </label>
        <Button variant="outline" size="sm" onClick={() => onEdit(banner)}>
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
