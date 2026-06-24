import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/shared/StarRating'
import { formatRelativeTime } from '@/lib/format'
import { resourceReviewService } from '@/services/resource-review.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ResourceReview } from '@/types/resource-reviews'

interface ResourceReviewSectionProps {
  resourceId: string
  reviews: ResourceReview[]
}

export function ResourceReviewSection({ resourceId, reviews }: ResourceReviewSectionProps) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  const myReview = reviews.find((r) => r.author_id === user?.id)
  const [editingReviewId, setEditingReviewId] = useState(myReview?.id)
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [body, setBody] = useState(myReview?.body ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  if (myReview?.id !== editingReviewId) {
    setEditingReviewId(myReview?.id)
    setRating(myReview?.rating ?? 0)
    setBody(myReview?.body ?? '')
  }

  const upsertMutation = useMutation({
    mutationFn: () => resourceReviewService.upsertReview(resourceId, user!.id, rating, body || null),
    onSuccess: () => {
      setFormError(null)
      queryClient.invalidateQueries({ queryKey: ['resource-reviews', resourceId] })
      queryClient.invalidateQueries({ queryKey: ['resource', resourceId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => resourceReviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-reviews', resourceId] })
      queryClient.invalidateQueries({ queryKey: ['resource', resourceId] })
    },
  })

  const handleSubmit = () => {
    if (rating < 1) {
      setFormError('Elige una puntuación')
      return
    }
    upsertMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Sé la primera en dejar una reseña.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const canDelete = review.author_id === user?.id || isMod
            return (
              <div key={review.id} className="flex gap-3">
                {review.author && (
                  <Link to={`/profile/${review.author.alias}`}>
                    <Avatar src={review.author.avatar_url} alias={review.author.alias} size="sm" />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {review.author ? (
                      <Link
                        to={`/profile/${review.author.alias}`}
                        className="text-sm font-semibold hover:text-accent"
                      >
                        @{review.author.alias}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">@—</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(review.created_at)}
                    </span>
                  </div>
                  <StarRating value={review.rating} size="sm" className="mt-1" />
                  {review.body && <p className="mt-1 text-sm whitespace-pre-wrap">{review.body}</p>}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 gap-1 text-xs text-destructive"
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {user && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">
            {myReview ? 'Edita tu reseña' : 'Deja tu reseña'}
          </p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            placeholder="Cuéntanos tu experiencia (opcional)"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button size="sm" onClick={handleSubmit} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {myReview ? 'Actualizar reseña' : 'Publicar reseña'}
          </Button>
        </div>
      )}
    </div>
  )
}
