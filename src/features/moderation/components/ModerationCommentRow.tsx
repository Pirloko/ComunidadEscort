import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, truncateText } from '@/lib/format'
import { commentService } from '@/services/comment.service'
import type { ModerationComment } from '@/types/moderation'

interface ModerationCommentRowProps {
  comment: ModerationComment
}

export function ModerationCommentRow({ comment }: ModerationCommentRowProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => commentService.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
    },
  })

  const cityName = (() => {
    const city = comment.post?.city
    if (!city) return null
    return Array.isArray(city) ? city[0]?.name : city.name
  })()

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {comment.parent_id && (
          <span className="text-xs font-medium text-muted-foreground">↩ Respuesta</span>
        )}
        <p className="mt-1 text-sm whitespace-pre-wrap">{truncateText(comment.content, 200)}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          @{comment.author?.alias ?? '—'}
          {cityName ? ` · ${cityName}` : ''} · {formatRelativeTime(comment.created_at)}
        </p>
        {comment.post && (
          <p className="mt-1 text-xs text-muted-foreground">
            En:{' '}
            <Link
              to={`/forum/${comment.post_id}`}
              className="font-medium text-accent hover:underline"
            >
              {comment.post.title}
            </Link>
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/forum/${comment.post_id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Ver post
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm('¿Eliminar este comentario?')) deleteMutation.mutate()
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
