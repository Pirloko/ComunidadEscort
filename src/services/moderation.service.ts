import { supabase } from '@/lib/supabase/client'
import type { Post } from '@/types/forum'
import type { ModerationComment, ModerationStats } from '@/types/moderation'

const POST_SELECT = `
  id, author_id, city_id, category, title, content,
  is_pinned, is_locked, likes_count, comments_count,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

const COMMENT_SELECT = `
  id, post_id, author_id, parent_id, content,
  likes_count, created_at,
  author:profiles!author_id(id, alias, avatar_url),
  post:posts!post_id(id, title, city:cities!city_id(id, name))
`

async function getPostIdsByCity(cityId: string): Promise<string[]> {
  const { data, error } = await supabase.from('posts').select('id').eq('city_id', cityId)
  if (error) throw error
  return (data ?? []).map((p) => p.id)
}

export const moderationService = {
  async getStats(cityId?: string): Promise<ModerationStats> {
    const cityFilter = cityId ? { city_id: cityId } : {}

    const pendingQuery = supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendiente')

    const approvedQuery = supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprobada')
      .match(cityFilter)

    const postsQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .match(cityFilter)

    const pinnedQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_pinned', true)
      .match(cityFilter)

    const lockedQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_locked', true)
      .match(cityFilter)

    let commentsQuery
    if (cityId) {
      const postIds = await getPostIdsByCity(cityId)
      commentsQuery = postIds.length
        ? supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds)
        : Promise.resolve({ count: 0, error: null })
    } else {
      commentsQuery = supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
    }

    const [pending, approved, posts, pinned, locked, comments] = await Promise.all([
      pendingQuery,
      approvedQuery,
      postsQuery,
      pinnedQuery,
      lockedQuery,
      commentsQuery,
    ])

    if (pending.error) throw pending.error
    if (approved.error) throw approved.error
    if (posts.error) throw posts.error
    if (pinned.error) throw pinned.error
    if (locked.error) throw locked.error
    if ('error' in comments && comments.error) throw comments.error

    return {
      pendingAlerts: pending.count ?? 0,
      approvedAlerts: approved.count ?? 0,
      totalPosts: posts.count ?? 0,
      pinnedPosts: pinned.count ?? 0,
      lockedPosts: locked.count ?? 0,
      totalComments: comments.count ?? 0,
    }
  },

  async getPostsForModeration(params: {
    cityId?: string
    search?: string
    limit?: number
  }): Promise<Post[]> {
    let query = supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })

    if (params.cityId) query = query.eq('city_id', params.cityId)
    if (params.search?.trim()) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
    }
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as Post[]
  },

  async getRecentComments(params: {
    cityId?: string
    limit?: number
  }): Promise<ModerationComment[]> {
    let query = supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50)

    if (params.cityId) {
      const postIds = await getPostIdsByCity(params.cityId)
      if (!postIds.length) return []
      query = query.in('post_id', postIds)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as ModerationComment[]
  },

  async getPendingAlertsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendiente')

    if (error) throw error
    return count ?? 0
  },

  async getPendingResourcesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendiente')

    if (error) throw error
    return count ?? 0
  },
}
