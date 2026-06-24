import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  resourceCommentSchema,
  type ResourceCommentFormData,
} from '@/features/resources/schemas/resource.schema'
import { formatRelativeTime } from '@/lib/format'
import { resourceCommentService } from '@/services/resource-comment.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ResourceComment } from '@/types/resource-comments'

interface ResourceCommentThreadProps {
  resourceId: string
  comments: ResourceComment[]
}

function ResourceCommentItem({
  comment,
  resourceId,
}: {
  comment: ResourceComment
  resourceId: string
}) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const isAuthor = user?.id === comment.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  const deleteMutation = useMutation({
    mutationFn: () => resourceCommentService.deleteComment(comment.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['resource-comments', resourceId] }),
  })

  return (
    <div className="flex gap-3">
      {comment.author && (
        <Link to={`/profile/${comment.author.alias}`}>
          <Avatar src={comment.author.avatar_url} alias={comment.author.alias} size="sm" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {comment.author ? (
            <Link
              to={`/profile/${comment.author.alias}`}
              className="text-sm font-semibold hover:text-accent"
            >
              @{comment.author.alias}
            </Link>
          ) : (
            <span className="text-sm font-semibold">@—</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
        {(isAuthor || isMod) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 gap-1 text-xs text-destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </Button>
        )}
      </div>
    </div>
  )
}

export function ResourceCommentThread({ resourceId, comments }: ResourceCommentThreadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResourceCommentFormData>({ resolver: zodResolver(resourceCommentSchema) })

  const onSubmit = async (data: ResourceCommentFormData) => {
    await resourceCommentService.createComment(resourceId, user!.id, data.content)
    reset()
    queryClient.invalidateQueries({ queryKey: ['resource-comments', resourceId] })
  }

  return (
    <div className="space-y-6">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Sé la primera en comentar.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <ResourceCommentItem key={comment.id} comment={comment} resourceId={resourceId} />
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
          <Textarea placeholder="Escribe un comentario..." rows={3} {...register('content')} />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Comentar
          </Button>
        </form>
      )}
    </div>
  )
}
