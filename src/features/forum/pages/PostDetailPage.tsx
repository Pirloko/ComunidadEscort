import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CommentThread } from '@/features/forum/components/CommentThread'
import { LikeButton } from '@/features/forum/components/LikeButton'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { ReportButton } from '@/features/reports/components/ReportButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import { displayAuthorAlias } from '@/lib/display-alias'
import { postService } from '@/services/post.service'
import { commentService } from '@/services/comment.service'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const p = await postService.getPostById(postId!)
      if (!p) return null
      if (user) {
        const [enriched] = await postService.enrichWithLikes([p], user.id)
        return enriched
      }
      return p
    },
    enabled: !!postId,
  })

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentService.getCommentsByPost(postId!),
    enabled: !!postId,
  })

  const isAuthor = user?.id === post?.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  const handleDelete = async () => {
    if (!post || !confirm('¿Eliminar esta publicación?')) return
    await postService.deletePost(post.id)
    navigate('/forum')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !post) {
    return <ErrorState title="Publicación no encontrada" onRetry={() => refetch()} />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al foro
      </Link>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {post.author && (
                <Link to={`/profile/${post.author.alias}`}>
                  <Avatar
                    src={post.author.avatar_url}
                    alias={displayAuthorAlias(post.author.alias)}
                    size="lg"
                  />
                </Link>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {post.author && (
                    <Link to={`/profile/${post.author.alias}`} className="font-semibold hover:text-accent">
                      @{displayAuthorAlias(post.author.alias)}
                    </Link>
                  )}
                  <CategoryBadge category={post.category} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatRelativeTime(post.created_at)}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <BookmarkButton itemType="post" itemId={post.id} size="sm" />
              {!isAuthor && <ReportButton targetType="post" targetId={post.id} size="sm" />}
              {isAuthor && !post.is_locked && (
                <Link to={`/forum/${post.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {(isAuthor || isMod) && (
                <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">{post.title}</h1>
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-2 border-t pt-4">
            <LikeButton
              postId={post.id}
              initialCount={post.likes_count}
              initialLiked={post.liked_by_me ?? false}
            />
            <span className="text-sm text-muted-foreground">
              {post.comments_count} comentario{post.comments_count !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Comentarios</h2>
        </CardHeader>
        <CardContent>
          {commentsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <CommentThread postId={post.id} comments={comments} isLocked={post.is_locked} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
