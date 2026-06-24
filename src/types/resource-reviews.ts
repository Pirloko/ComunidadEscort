import type { ResourceAuthor } from '@/types/resources'

export interface ResourceReview {
  id: string
  resource_id: string
  author_id: string
  rating: number
  body: string | null
  created_at: string
  author?: ResourceAuthor
}
