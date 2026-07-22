import { Link } from 'react-router-dom'
import { Home, ShieldAlert, ThumbsUp, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/shared/StarRating'
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { formatRelativeTime, truncateText } from '@/lib/format'
import { shareCasaReviewText } from '@/lib/share'
import { cn } from '@/lib/utils'
import type { ResourceReview } from '@/types/resource-reviews'

interface CasaReviewActivityCardProps {
  review: ResourceReview
}

export function CasaReviewActivityCard({ review }: CasaReviewActivityCardProps) {
  const isFuna = review.rating <= 2
  const label = isFuna ? 'Funa de casa' : 'Recomendación de casa'
  const to = `/casas/${review.resource_id}`
  const houseName = review.resource?.name ?? 'Casa / habitación'
  const snippet =
    review.service_notes ||
    review.owner_notes ||
    review.body ||
    'Sin comentario adicional.'

  return (
    <Card className="relative transition-shadow hover:shadow-md">
      <Link to={to}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                isFuna
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-emerald-500/15 text-emerald-500',
              )}
            >
              {isFuna ? <ShieldAlert className="h-5 w-5" /> : <ThumbsUp className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    isFuna
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
                  )}
                >
                  {label}
                </span>
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <h3 className="mt-2 font-semibold leading-snug">{houseName}</h3>

              <StarRating value={review.rating} size="sm" className="mt-1" />

              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {truncateText(snippet, 140)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {review.resource?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {review.resource.city.name}
                  </span>
                )}
                <span>·</span>
                <span>{formatRelativeTime(review.created_at)}</span>
                {review.author && (
                  <>
                    <span>·</span>
                    <span>Por @{review.author.alias}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
      <div className="border-t px-3 py-2">
        <ShareWhatsAppButton
          size="sm"
          variant="ghost"
          label="Compartir con alguna amiga"
          className="h-8 w-full justify-start px-2 text-xs"
          text={shareCasaReviewText({
            isFuna,
            houseName,
            rating: review.rating,
            path: `${to}#reseña-${review.id}`,
          })}
        />
      </div>
    </Card>
  )
}
