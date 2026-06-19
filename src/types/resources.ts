import type { AlertStatus, ResourceCategory } from '@/types/database'

export interface ResourceAuthor {
  id: string
  alias: string
  avatar_url: string | null
}

export interface ResourceCity {
  id: string
  name: string
  slug: string
}

export interface Resource {
  id: string
  author_id: string
  city_id: string
  category: ResourceCategory
  status: AlertStatus
  name: string
  description: string | null
  phone: string | null
  address: string | null
  website: string | null
  is_verified: boolean
  is_active: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  author?: ResourceAuthor
  city?: ResourceCity
}

export interface CreateResourceInput {
  city_id: string
  category: ResourceCategory
  name: string
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
}

export interface UpdateResourceInput {
  category?: ResourceCategory
  name?: string
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  is_verified?: boolean
  is_active?: boolean
}

export interface ReviewResourceInput {
  status: 'aprobada' | 'rechazada'
  rejection_reason?: string
}
