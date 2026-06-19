import { supabase } from '@/lib/supabase/client'
import type { PostCategory } from '@/types/database'
import type { CreatePostInput, Post, UpdatePostInput } from '@/types/forum'

const POST_SELECT = `
  id, author_id, city_id, category, title, content,
  is_pinned, is_locked, likes_count, comments_count,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

export const postService = {
  async getPosts(params: {
    cityId: string
    category?: PostCategory
    search?: string
    limit?: number
    offset?: number
  }): Promise<Post[]> {
    let query = supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('city_id', params.cityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.category) {
      query = query.eq('category', params.category)
    }

    if (params.search?.trim()) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
    }

    if (params.limit) query = query.limit(params.limit)
    if (params.offset) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as Post[]
  },

  async getPostById(postId: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', postId)
      .maybeSingle()

    if (error) throw error
    return data as unknown as Post | null
  },

  async getPostsByAuthor(authorId: string, limit = 5): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as unknown as Post[]
  },

  async getCategoryCounts(cityId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('posts')
      .select('category')
      .eq('city_id', cityId)

    if (error) throw error

    const counts: Record<string, number> = { all: data?.length ?? 0 }
    for (const row of data ?? []) {
      counts[row.category] = (counts[row.category] ?? 0) + 1
    }
    return counts
  },

  async createPost(authorId: string, input: CreatePostInput): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...input, author_id: authorId })
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Post
  },

  async updatePost(postId: string, input: UpdatePostInput): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(input)
      .eq('id', postId)
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Post
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw error
  },

  async togglePin(postId: string, isPinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId)
    if (error) throw error
  },

  async toggleLock(postId: string, isLocked: boolean): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .update({ is_locked: isLocked })
      .eq('id', postId)
    if (error) throw error
  },

  async getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (!postIds.length) return new Set()
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error) throw error
    return new Set((data ?? []).map((r) => r.post_id))
  },

  async toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
    if (liked) {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
      if (error) throw error
    }
  },

  async enrichWithLikes(posts: Post[], userId: string): Promise<Post[]> {
    const liked = await postService.getLikedPostIds(userId, posts.map((p) => p.id))
    return posts.map((p) => ({ ...p, liked_by_me: liked.has(p.id) }))
  },
}
