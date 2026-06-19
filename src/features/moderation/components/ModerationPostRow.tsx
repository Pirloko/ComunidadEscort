import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Lock, Pin, Trash2, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { formatRelativeTime, truncateText } from '@/lib/format'
import { postService } from '@/services/post.service'
import type { Post } from '@/types/forum'

interface ModerationPostRowProps {
  post: Post
}

export function ModerationPostRow({ post }: ModerationPostRowProps) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['moderation-posts'] })
    queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const pinMutation = useMutation({
    mutationFn: () => postService.togglePin(post.id, !post.is_pinned),
    onSuccess: invalidate,
  })

  const lockMutation = useMutation({
    mutationFn: () => postService.toggleLock(post.id, !post.is_locked),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: () => postService.deletePost(post.id),
    onSuccess: invalidate,
  })

  const isPending =
    pinMutation.isPending || lockMutation.isPending || deleteMutation.isPending

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          {post.is_pinned && (
            <span className="text-xs font-medium text-accent">Fijado</span>
          )}
          {post.is_locked && (
            <span className="text-xs font-medium text-destructive">Bloqueado</span>
          )}
        </div>
        <Link
          to={`/forum/${post.id}`}
          className="mt-1 block font-semibold hover:text-accent"
        >
          {post.title}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {truncateText(post.content, 120)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          @{post.author?.alias ?? '—'} · {post.city?.name} ·{' '}
          {formatRelativeTime(post.created_at)} · {post.comments_count} comentarios
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/forum/${post.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Ver
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => pinMutation.mutate()}
          disabled={isPending}
          title={post.is_pinned ? 'Desfijar' : 'Fijar'}
        >
          <Pin className={`h-3.5 w-3.5 ${post.is_pinned ? 'text-accent' : ''}`} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => lockMutation.mutate()}
          disabled={isPending}
          title={post.is_locked ? 'Desbloquear' : 'Bloquear'}
        >
          {post.is_locked ? (
            <Unlock className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm('¿Eliminar esta publicación?')) deleteMutation.mutate()
          }}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
