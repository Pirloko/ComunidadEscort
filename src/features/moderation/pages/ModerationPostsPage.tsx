import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ModerationPostRow } from '@/features/moderation/components/ModerationPostRow'
import { useCity } from '@/features/cities/context/CityContext'
import { moderationService } from '@/services/moderation.service'

export function ModerationPostsPage() {
  const { selectedCityId, selectedCity } = useCity()
  const [search, setSearch] = useState('')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['moderation-posts', selectedCityId, search],
    queryFn: () =>
      moderationService.getPostsForModeration({
        cityId: selectedCityId ?? undefined,
        search: search || undefined,
        limit: 50,
      }),
    enabled: !!selectedCityId,
  })

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">
          Publicaciones
          {selectedCity ? ` · ${selectedCity.name}` : ''}
        </CardTitle>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o contenido..."
          className="max-w-md"
        />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Sin publicaciones"
            description="No hay posts que coincidan con la búsqueda."
          />
        )}

        {posts.map((post) => (
          <ModerationPostRow key={post.id} post={post} />
        ))}
      </CardContent>
    </Card>
  )
}
