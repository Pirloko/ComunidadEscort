import type { AlertCategory, AlertReportKind, AlertStatus } from '@/types/database'

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

export interface AlertMedia {
  id: string
  alert_id: string
  kind: 'image' | 'video'
  storage_path: string
  sort_order: number
  duration_sec: number | null
  created_at: string
  url?: string
}

export interface Alert {
  id: string
  author_id: string
  city_id: string | null
  category: AlertCategory
  status: AlertStatus
  title: string
  description: string
  location_detail: string | null
  report_kind: AlertReportKind
  client_number: string | null
  category_other: string | null
  city_other: string | null
  rating: number | null
  treatment_notes: string | null
  hygiene_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  author?: AlertAuthor
  city?: AlertCity | null
  media?: AlertMedia[]
}

export interface CreateAlertInput {
  city_id?: string | null
  category: AlertCategory
  title: string
  description: string
  location_detail?: string | null
  report_kind: AlertReportKind
  client_number?: string | null
  category_other?: string | null
  city_other?: string | null
  rating?: number | null
  treatment_notes?: string | null
  hygiene_notes?: string | null
}

export interface ReviewAlertInput {
  status: 'aprobada' | 'rechazada'
  rejection_reason?: string
}
