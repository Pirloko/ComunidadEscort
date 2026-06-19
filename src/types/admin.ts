import type { UserRole } from '@/types/database'

export type AccountStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'bloqueada'

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  moderators: number
  totalCities: number
  activeCities: number
  unverifiedResources: number
  totalResources: number
  pendingAlerts: number
}

export interface AdminProfile {
  id: string
  alias: string
  email: string
  city_id: string
  role: UserRole
  is_active: boolean
  account_status: AccountStatus
  publication_link: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
  city?: { id: string; name: string }
}

export interface ReviewAccountInput {
  account_status: 'aprobada' | 'rechazada' | 'bloqueada'
  rejection_reason?: string
}

export interface AdminCity {
  id: string
  name: string
  slug: string
  region_id: string
  is_active: boolean
  created_at: string
  region?: { id: string; name: string; code: string }
}

export interface CreateCityInput {
  name: string
  slug: string
  region_id: string
  is_active?: boolean
}

export interface UpdateCityInput {
  name?: string
  slug?: string
  region_id?: string
  is_active?: boolean
}
