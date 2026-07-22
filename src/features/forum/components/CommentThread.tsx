import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2, Reply } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ReportButton } from '@/features/reports/components/ReportButton'
import { commentSchema, type CommentFormData } from '@/features/forum/schemas/forum.schema'
import { formatRelativeTime } from '@/lib/format'
import { displayAuthorAlias } from '@/lib/display-alias'
import { commentService } from '@/services/comment.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Comment } from '@/types/forum'

interface CommentThreadProps {
  postId: string
  comments: Comment[]
  isLocked?: boolean
}

function CommentItem({
  comment,
  postId,
  onReply,
  depth = 0,
}: {
  comment: Comment
  postId: string
  onReply: () => void
  depth?: number
}) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const isAuthor = user?.id === comment.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  const deleteMutation = useMutation({
    mutationFn: () => commentService.deleteComment(comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  })

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-accent/20 pl-4' : ''}>
      <div className="flex gap-3">
        {comment.author && (
          <Link to={`/profile/${comment.author.alias}`}>
            <Avatar
              src={comment.author.avatar_url}
              alias={displayAuthorAlias(comment.author.alias)}
              size="sm"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {comment.author ? (
              <Link
                to={`/profile/${comment.author.alias}`}
                className="text-sm font-semibold hover:text-accent"
              >
                @{displayAuthorAlias(comment.author.alias)}
              </Link>
            ) : (
              <span className="text-sm font-semibold">@—</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="mt-1 flex items-center gap-2">
            {depth === 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onReply}>
                <Reply className="h-3 w-3" />
                Responder
              </Button>
            )}
            {(isAuthor || isMod) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3" />
                Eliminar
              </Button>
            )}
            {!isAuthor && (
              <ReportButton targetType="comment" targetId={comment.id} size="sm" className="h-7" />
            )}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} postId={postId} onReply={onReply} depth={1} />
      ))}
    </div>
  )
}

export function CommentThread({ postId, comments, isLocked }: CommentThreadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({ resolver: zodResolver(commentSchema) })

  const onSubmit = async (data: CommentFormData) => {
    await commentService.createComment(postId, user!.id, data.content, replyTo ?? undefined)
    reset()
    setReplyTo(null)
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    queryClient.invalidateQueries({ queryKey: ['post', postId] })
  }

  if (isLocked) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        Esta publicación está cerrada para comentarios.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Sé la primera en comentar.
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={() => setReplyTo(comment.id)}
            />
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
          {replyTo && (
            <p className="text-xs text-accent">
              Respondiendo a un comentario ·{' '}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancelar
              </button>
            </p>
          )}
          <Textarea
            placeholder="Escribe un comentario..."
            rows={3}
            {...register('content')}
          />
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
