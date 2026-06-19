import type { PostAuthor } from '@/types/forum'

export interface ModerationStats {
  pendingAlerts: number
  approvedAlerts: number
  totalPosts: number
  pinnedPosts: number
  lockedPosts: number
  totalComments: number
}

export interface ModerationComment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  author?: PostAuthor
  post?: {
    id: string
    title: string
    city?: { id: string; name: string }
  }
}
