import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { CategorySidebar } from '@/features/forum/components/CategorySidebar'
import { PostCard } from '@/features/forum/components/PostCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { postService } from '@/services/post.service'
import type { PostCategory } from '@/types/database'

const PAGE_SIZE = 15

export function ForumPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState<PostCategory | 'all'>('all')

  const { data: counts = {} } = useQuery({
    queryKey: ['post-counts', 'all'],
    queryFn: () => postService.getCategoryCounts(),
  })

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['posts', 'all', category],
    queryFn: async ({ pageParam }) => {
      const raw = await postService.getPosts({
        category: category === 'all' ? undefined : category,
        limit: PAGE_SIZE,
        offset: pageParam,
      })
      return user ? postService.enrichWithLikes(raw, user.id) : raw
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPageParam + PAGE_SIZE,
  })

  const posts = data?.pages.flat() ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Foro comunitario</h1>
          <p className="text-muted-foreground">
            Publicaciones de todas las ciudades. Comparte experiencias, consejos y aprende junto a
            otras profesionales.
          </p>
        </div>
        <Link to="/forum/new">
          <Button variant="accent" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva publicación
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <div className="rounded-xl border bg-card p-2">
            <CategorySidebar selected={category} onSelect={setCategory} counts={counts} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </>
          )}

          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading && !isError && posts.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="Sin publicaciones"
              description={
                category === 'all'
                  ? 'Sé la primera en publicar en el foro.'
                  : 'No hay publicaciones en esta categoría aún.'
              }
              action={
                <Link to="/forum/new">
                  <Button variant="accent">Crear publicación</Button>
                </Link>
              }
            />
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más publicaciones'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
