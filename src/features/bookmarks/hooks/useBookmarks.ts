import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { bookmarkService } from '@/services/bookmark.service'
import type { BookmarkType } from '@/types/database'
import { bookmarkKey } from '@/types/bookmarks'

export function useBookmarks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: () => bookmarkService.getBookmarkKeys(user!.id),
    enabled: !!user?.id,
    select: (keys) => new Set(keys),
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      itemType,
      itemId,
      saved,
    }: {
      itemType: BookmarkType
      itemId: string
      saved: boolean
    }) => bookmarkService.toggleBookmark(user!.id, itemType, itemId, saved),
    onMutate: async ({ itemType, itemId, saved }) => {
      const key = ['bookmarks', user?.id] as const
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Set<string>>(key)
      const next = new Set(previous ?? [])
      const itemKey = bookmarkKey(itemType, itemId)
      if (saved) next.delete(itemKey)
      else next.add(itemKey)
      queryClient.setQueryData(key, next)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookmarks', user?.id], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks-page'] })
    },
  })

  const isBookmarked = (itemType: BookmarkType, itemId: string) =>
    bookmarksQuery.data?.has(bookmarkKey(itemType, itemId)) ?? false

  const toggle = (itemType: BookmarkType, itemId: string) => {
    if (!user) return
    const saved = isBookmarked(itemType, itemId)
    toggleMutation.mutate({ itemType, itemId, saved })
  }

  return {
    isBookmarked,
    toggle,
    count: bookmarksQuery.data?.size ?? 0,
    isLoading: bookmarksQuery.isLoading,
    isPending: toggleMutation.isPending,
  }
}
