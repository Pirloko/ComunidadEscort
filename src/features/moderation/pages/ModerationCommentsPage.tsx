import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ModerationCommentRow } from '@/features/moderation/components/ModerationCommentRow'
import { useCity } from '@/features/cities/context/CityContext'
import { moderationService } from '@/services/moderation.service'

export function ModerationCommentsPage() {
  const { selectedCityId, selectedCity } = useCity()

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['moderation-comments', selectedCityId],
    queryFn: () =>
      moderationService.getRecentComments({
        cityId: selectedCityId ?? undefined,
        limit: 50,
      }),
    enabled: !!selectedCityId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Comentarios recientes
          {selectedCity ? ` · ${selectedCity.name}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="Sin comentarios"
            description="No hay comentarios en esta ciudad."
          />
        )}

        {comments.map((comment) => (
          <ModerationCommentRow key={comment.id} comment={comment} />
        ))}
      </CardContent>
    </Card>
  )
}
