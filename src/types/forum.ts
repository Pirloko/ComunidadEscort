import type { PostCategory } from '@/types/database'

export interface PostAuthor {
  id: string
  alias: string
  avatar_url: string | null
}

export interface PostCity {
  id: string
  name: string
  slug: string
}

export interface Post {
  id: string
  author_id: string
  city_id: string
  category: PostCategory
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  author?: PostAuthor
  city?: PostCity
  liked_by_me?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  author?: PostAuthor
  liked_by_me?: boolean
  replies?: Comment[]
}

export interface CreatePostInput {
  city_id: string
  category: PostCategory
  title: string
  content: string
}

export interface UpdatePostInput {
  category?: PostCategory
  title?: string
  content?: string
}
