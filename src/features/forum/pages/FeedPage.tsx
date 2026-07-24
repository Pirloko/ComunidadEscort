import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Home, UserX, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { CasaReviewActivityCard } from '@/features/forum/components/CasaReviewActivityCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { alertService } from '@/services/alert.service'
import { resourceReviewService } from '@/services/resource-review.service'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types/alerts'
import type { ResourceReview } from '@/types/resource-reviews'

type ActivityItem =
  | { kind: 'cliente'; at: string; alert: Alert }
  | { kind: 'casa'; at: string; review: ResourceReview }

const FEED_LIMIT = 8

export function FeedPage() {
  const { profile } = useAuth()

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', 'feed-activity'],
    queryFn: () => alertService.getApprovedAlerts({ limit: FEED_LIMIT }),
  })

  const { data: casaReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['casa-reviews', 'feed-activity'],
    queryFn: () => resourceReviewService.getRecentHabitacionReviews(FEED_LIMIT),
  })

  const isLoading = alertsLoading || reviewsLoading

  const activity = useMemo(() => {
    const items: ActivityItem[] = [
      ...alerts.map((alert) => ({
        kind: 'cliente' as const,
        at: alert.created_at,
        alert,
      })),
      ...casaReviews.map((review) => ({
        kind: 'casa' as const,
        at: review.created_at,
        review,
      })),
    ]
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, FEED_LIMIT)
  }, [alerts, casaReviews])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="page-title">Hola, {profile?.alias}</h1>
        <p className="page-subtitle mt-1.5">
          Bienvenida a tu comunidad segura.
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          to="/casas"
          className={cn(
            'flex items-center gap-4 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-4',
            'transition-opacity active:opacity-90',
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold text-foreground">
              Busca Habitaciones Para Escort
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Busca por ciudad, deja reseñas, recomendaciones o funas
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          to="/alerts/new"
          className={cn(
            'flex items-center gap-4 rounded-2xl border border-destructive/25 bg-gradient-to-br from-destructive/10 via-card to-card p-4',
            'transition-opacity active:opacity-90',
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
            <UserX className="h-6 w-6 text-destructive" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold text-foreground">Funar o recomendar cliente</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Reportes verificados antes de publicarse
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title">Actividad reciente</h2>
          <Link
            to="/alerts"
            className="flex shrink-0 items-center gap-1 text-sm text-accent hover:underline"
          >
            Ver clientes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && <Skeleton className="h-36 rounded-xl" />}

        {!isLoading && activity.length === 0 && (
          <Card>
            <CardContent className="space-y-2 py-8 text-center text-sm text-muted-foreground">
              <p>Aún no hay actividad reciente.</p>
              <Link to="/alerts/new" className="block text-destructive hover:underline">
                Funar o recomendar un cliente
              </Link>
              <Link to="/casas" className="block text-primary hover:underline">
                Reseñar una casa
              </Link>
            </CardContent>
          </Card>
        )}

        {!isLoading && activity.length > 0 && (
          <div className="grid gap-4">
            {activity.map((item) =>
              item.kind === 'cliente' ? (
                <AlertCard key={`a-${item.alert.id}`} alert={item.alert} />
              ) : (
                <CasaReviewActivityCard key={`r-${item.review.id}`} review={item.review} />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  )
}
