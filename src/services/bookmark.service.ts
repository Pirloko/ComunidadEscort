import { supabase } from '@/lib/supabase/client'
import type { BookmarkType } from '@/types/database'
import type { Alert } from '@/types/alerts'
import type { Post } from '@/types/forum'
import type { Resource } from '@/types/resources'
import type { Bookmark, BookmarkWithItem } from '@/types/bookmarks'
import { bookmarkKey } from '@/types/bookmarks'

const POST_SELECT = `
  id, author_id, city_id, category, title, content,
  is_pinned, is_locked, likes_count, comments_count,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

const ALERT_SELECT = `
  id, author_id, city_id, category, status, title, description,
  location_detail, reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

const RESOURCE_SELECT = `
  id, author_id, city_id, category, status, name, description,
  phone, address, website, is_verified, is_active,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

export const bookmarkService = {
  async getBookmarkKeys(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('item_type, item_id')
      .eq('user_id', userId)

    if (error) throw error
    return (data ?? []).map((b) => bookmarkKey(b.item_type as BookmarkType, b.item_id))
  },

  async getCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error
    return count ?? 0
  },

  async addBookmark(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
  ): Promise<void> {
    const { error } = await supabase.from('bookmarks').insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
    })

    if (error) throw error
  },

  async removeBookmark(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)

    if (error) throw error
  },

  async toggleBookmark(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
    saved: boolean,
  ): Promise<void> {
    if (saved) {
      await bookmarkService.removeBookmark(userId, itemType, itemId)
    } else {
      await bookmarkService.addBookmark(userId, itemType, itemId)
    }
  },

  async getBookmarksWithItems(
    userId: string,
    filter?: BookmarkType | 'all',
  ): Promise<BookmarkWithItem[]> {
    let query = supabase
      .from('bookmarks')
      .select('id, user_id, item_type, item_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filter && filter !== 'all') {
      query = query.eq('item_type', filter)
    }

    const { data: bookmarks, error } = await query
    if (error) throw error
    if (!bookmarks?.length) return []

    const typed = bookmarks as Bookmark[]
    const postIds = typed.filter((b) => b.item_type === 'post').map((b) => b.item_id)
    const alertIds = typed.filter((b) => b.item_type === 'alert').map((b) => b.item_id)
    const resourceIds = typed.filter((b) => b.item_type === 'resource').map((b) => b.item_id)

    const [postsRes, alertsRes, resourcesRes] = await Promise.all([
      postIds.length
        ? supabase.from('posts').select(POST_SELECT).in('id', postIds)
        : Promise.resolve({ data: [], error: null }),
      alertIds.length
        ? supabase.from('alerts').select(ALERT_SELECT).in('id', alertIds)
        : Promise.resolve({ data: [], error: null }),
      resourceIds.length
        ? supabase.from('resources').select(RESOURCE_SELECT).in('id', resourceIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (postsRes.error) throw postsRes.error
    if (alertsRes.error) throw alertsRes.error
    if (resourcesRes.error) throw resourcesRes.error

    const postsMap = new Map(
      ((postsRes.data ?? []) as unknown as Post[]).map((p) => [p.id, p]),
    )
    const alertsMap = new Map(
      ((alertsRes.data ?? []) as unknown as Alert[]).map((a) => [a.id, a]),
    )
    const resourcesMap = new Map(
      ((resourcesRes.data ?? []) as unknown as Resource[]).map((r) => [r.id, r]),
    )

    const result: BookmarkWithItem[] = []

    for (const bookmark of typed) {
      if (bookmark.item_type === 'post') {
        const item = postsMap.get(bookmark.item_id)
        if (item) result.push({ bookmark, item_type: 'post', item })
      } else if (bookmark.item_type === 'alert') {
        const item = alertsMap.get(bookmark.item_id)
        if (item) result.push({ bookmark, item_type: 'alert', item })
      } else if (bookmark.item_type === 'resource') {
        const item = resourcesMap.get(bookmark.item_id)
        if (item) result.push({ bookmark, item_type: 'resource', item })
      }
    }

    return result
  },
}
