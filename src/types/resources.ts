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

export interface ResourcePhoto {
  id: string
  resource_id: string
  url: string
  sort_order: number
  created_at: string
}

export interface HabitacionAttrs {
  is_public: boolean
  house_rules: string | null
  contact_phone: string | null
  recibe_mujer: boolean
  recibe_hombre: boolean
  pide_reserva: boolean
  pide_referencias: boolean
  pide_doc_identidad: boolean
  pide_link_publicacion: boolean
  acepta_parejas: boolean
  recibe_agencias: boolean
  tiene_camaras_seguridad: boolean
  tiene_wifi: boolean
  tiene_kit_primeros_auxilios: boolean
  tiene_extintor: boolean
}

export interface Resource extends HabitacionAttrs {
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
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  whatsapp_phone: string | null
  rating_avg: number | null
  reviews_count: number
  is_verified: boolean
  is_active: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  author?: ResourceAuthor
  city?: ResourceCity
  photos?: ResourcePhoto[]
}

export interface CreateResourceInput {
  city_id: string
  category: ResourceCategory
  name: string
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  latitude?: number | null
  longitude?: number | null
  google_maps_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  whatsapp_phone?: string | null
  contact_phone?: string | null
  is_public?: boolean
  house_rules?: string | null
  recibe_mujer?: boolean
  recibe_hombre?: boolean
  pide_reserva?: boolean
  pide_referencias?: boolean
  pide_doc_identidad?: boolean
  pide_link_publicacion?: boolean
  acepta_parejas?: boolean
  recibe_agencias?: boolean
  tiene_camaras_seguridad?: boolean
  tiene_wifi?: boolean
  tiene_kit_primeros_auxilios?: boolean
  tiene_extintor?: boolean
}

export interface UpdateResourceInput {
  city_id?: string
  category?: ResourceCategory
  name?: string
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  latitude?: number | null
  longitude?: number | null
  google_maps_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  whatsapp_phone?: string | null
  contact_phone?: string | null
  is_public?: boolean
  house_rules?: string | null
  recibe_mujer?: boolean
  recibe_hombre?: boolean
  pide_reserva?: boolean
  pide_referencias?: boolean
  pide_doc_identidad?: boolean
  pide_link_publicacion?: boolean
  acepta_parejas?: boolean
  recibe_agencias?: boolean
  tiene_camaras_seguridad?: boolean
  tiene_wifi?: boolean
  tiene_kit_primeros_auxilios?: boolean
  tiene_extintor?: boolean
  is_verified?: boolean
  is_active?: boolean
}

export interface ReviewResourceInput {
  status: 'aprobada' | 'rechazada'
  rejection_reason?: string
}

export interface PublicHabitacionFilters {
  search?: string
  cityId?: string
  tiene_wifi?: boolean
  pide_reserva?: boolean
  acepta_parejas?: boolean
  limit?: number
}
