import type { AlertCategory, AlertStatus } from '@/types/database'

export interface AlertAuthor {
  id: string
  alias: string
  avatar_url: string | null
}

export interface AlertCity {
  id: string
  name: string
  slug: string
}

export interface Alert {
  id: string
  author_id: string
  city_id: string
  category: AlertCategory
  status: AlertStatus
  title: string
  description: string
  location_detail: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  author?: AlertAuthor
  city?: AlertCity
}

export interface CreateAlertInput {
  city_id: string
  category: AlertCategory
  title: string
  description: string
  location_detail?: string
}

export interface ReviewAlertInput {
  status: 'aprobada' | 'rechazada'
  rejection_reason?: string
}
