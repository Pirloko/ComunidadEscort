import type { ResourceAuthor } from '@/types/resources'

export interface ResourceComment {
  id: string
  resource_id: string
  author_id: string
  content: string
  created_at: string
  author?: ResourceAuthor
}
