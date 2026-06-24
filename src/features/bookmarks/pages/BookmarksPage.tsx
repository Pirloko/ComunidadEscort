import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { PostCard } from '@/features/forum/components/PostCard'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { bookmarkService } from '@/services/bookmark.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { BookmarkType } from '@/types/database'

const FILTERS: { value: BookmarkType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'post', label: 'Publicaciones' },
  { value: 'alert', label: 'Alertas' },
  { value: 'resource', label: 'Datos de todo' },
]

export function BookmarksPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<BookmarkType | 'all'>('all')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['bookmarks-page', user?.id, filter],
    queryFn: () => bookmarkService.getBookmarksWithItems(user!.id, filter),
    enabled: !!user?.id,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guardados</h1>
        <p className="text-muted-foreground">
          Publicaciones, alertas y datos que guardaste para revisar después.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              filter === value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Sin guardados"
          description="Toca el ícono de marcador en publicaciones, alertas o datos para guardarlos aquí."
        />
      )}

      <div className="space-y-4">
        {items.map((entry) => {
          if (entry.item_type === 'post') {
            return <PostCard key={entry.bookmark.id} post={entry.item} />
          }
          if (entry.item_type === 'alert') {
            return (
              <AlertCard key={entry.bookmark.id} alert={entry.item} showStatus />
            )
          }
          return (
            <ResourceCard key={entry.bookmark.id} resource={entry.item} />
          )
        })}
      </div>

      {!isLoading && items.length > 0 && (
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            {items.length} elemento{items.length !== 1 ? 's' : ''} guardado
            {items.length !== 1 ? 's' : ''}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
