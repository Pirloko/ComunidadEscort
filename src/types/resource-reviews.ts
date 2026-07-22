import type { ResourceAuthor } from '@/types/resources'

export interface ResourceReviewPhoto {
  id: string
  review_id: string
  storage_path: string
  sort_order: number
  created_at: string
  url?: string
}

export interface ResourceReviewResource {
  id: string
  name: string
  category: string
  city?: { id: string; name: string; slug: string } | null
}

export interface ResourceReview {
  id: string
  resource_id: string
  author_id: string
  rating: number
  body: string | null
  service_notes: string | null
  owner_notes: string | null
  created_at: string
  author?: ResourceAuthor
  photos?: ResourceReviewPhoto[]
  resource?: ResourceReviewResource | null
}

export interface UpsertResourceReviewInput {
  rating: number
  body?: string | null
  service_notes?: string | null
  owner_notes?: string | null
}
