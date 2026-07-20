import { supabase } from '@/lib/supabase/client'
import type { ResourceCategory } from '@/types/database'
import type {
  CreateResourceInput,
  PublicHabitacionFilters,
  Resource,
  ResourcePhoto,
  ReviewResourceInput,
  UpdateResourceInput,
} from '@/types/resources'

const RESOURCE_SELECT = `
  id, author_id, city_id, category, status, name, description,
  phone, address, website, latitude, longitude, google_maps_url,
  instagram_url, facebook_url, whatsapp_phone, contact_phone,
  rating_avg, reviews_count, is_verified, is_active, is_public, house_rules,
  recibe_mujer, recibe_hombre, pide_reserva, pide_referencias,
  pide_doc_identidad, pide_link_publicacion, acepta_parejas, recibe_agencias,
  tiene_camaras_seguridad, tiene_wifi, tiene_kit_primeros_auxilios, tiene_extintor,
  reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug),
  photos:resource_photos(id, resource_id, url, sort_order, created_at)
`

const PUBLIC_HABITACION_SELECT = `
  id, author_id, city_id, category, status, name, description,
  phone, address, website, latitude, longitude, google_maps_url,
  instagram_url, facebook_url, whatsapp_phone, contact_phone,
  rating_avg, reviews_count, is_verified, is_active, is_public, house_rules,
  recibe_mujer, recibe_hombre, pide_reserva, pide_referencias,
  pide_doc_identidad, pide_link_publicacion, acepta_parejas, recibe_agencias,
  tiene_camaras_seguridad, tiene_wifi, tiene_kit_primeros_auxilios, tiene_extintor,
  reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  city:cities!city_id(id, name, slug),
  photos:resource_photos(id, resource_id, url, sort_order, created_at)
`

const PHOTOS_BUCKET = 'resource-photos'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function sortPhotos(resource: Resource): Resource {
  if (resource.photos) {
    resource.photos = [...resource.photos].sort((a, b) => a.sort_order - b.sort_order)
  }
  return resource
}

export const resourceService = {
  async getResources(params: {
    cityId: string
    category?: ResourceCategory
    search?: string
    limit?: number
  }): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('city_id', params.cityId)
      .eq('status', 'aprobada')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.category) query = query.eq('category', params.category)
    if (params.search?.trim()) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`,
      )
    }
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async getPublicHabitaciones(filters: PublicHabitacionFilters = {}): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select(PUBLIC_HABITACION_SELECT)
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')
      .order('created_at', { ascending: false })

    if (filters.cityId) query = query.eq('city_id', filters.cityId)
    if (filters.tiene_wifi) query = query.eq('tiene_wifi', true)
    if (filters.pide_reserva) query = query.eq('pide_reserva', true)
    if (filters.acepta_parejas) query = query.eq('acepta_parejas', true)
    if (filters.search?.trim()) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%`,
      )
    }
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query
    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async getPublicHabitacionById(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select(PUBLIC_HABITACION_SELECT)
      .eq('id', resourceId)
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')
      .maybeSingle()

    if (error) throw error
    return data ? sortPhotos(data as unknown as Resource) : null
  },

  async getResourceById(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('id', resourceId)
      .maybeSingle()

    if (error) throw error
    return data ? sortPhotos(data as unknown as Resource) : null
  },

  async getMyResources(authorId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async getPendingResources(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async getResourcesByAuthor(authorId: string): Promise<Resource[]> {
    return resourceService.getMyResources(authorId)
  },

  async getCount(cityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('status', 'aprobada')
      .eq('is_active', true)

    if (error) throw error
    return count ?? 0
  },

  async createResource(authorId: string, input: CreateResourceInput): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert({ ...input, author_id: authorId, status: 'aprobada' })
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return sortPhotos(data as unknown as Resource)
  },

  async updateResource(resourceId: string, input: UpdateResourceInput): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(input)
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return sortPhotos(data as unknown as Resource)
  },

  async reviewResource(
    resourceId: string,
    reviewerId: string,
    input: ReviewResourceInput,
  ): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update({
        status: input.status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: input.status === 'rechazada' ? input.rejection_reason : null,
      })
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return sortPhotos(data as unknown as Resource)
  },

  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase.from('resources').delete().eq('id', resourceId)
    if (error) throw error
  },

  async getUnverifiedResources(limit = 50): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'aprobada')
      .eq('is_verified', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async getAllResourcesForAdmin(params?: {
    search?: string
    onlyUnverified?: boolean
    limit?: number
  }): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'aprobada')
      .order('is_verified', { ascending: true })
      .order('created_at', { ascending: false })

    if (params?.onlyUnverified) query = query.eq('is_verified', false).eq('is_active', true)
    if (params?.search?.trim()) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }
    if (params?.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return ((data ?? []) as unknown as Resource[]).map(sortPhotos)
  },

  async uploadResourcePhoto(resourceId: string, file: File, sortOrder = 0): Promise<ResourcePhoto> {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
    }
    if (file.size > MAX_PHOTO_SIZE) {
      throw new Error('La imagen no puede superar 5 MB.')
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${resourceId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)
    const url = urlData.publicUrl

    const { data, error } = await supabase
      .from('resource_photos')
      .insert({ resource_id: resourceId, url, sort_order: sortOrder })
      .select('id, resource_id, url, sort_order, created_at')
      .single()

    if (error) throw error
    return data as ResourcePhoto
  },

  async deleteResourcePhoto(photoId: string, url: string): Promise<void> {
    const marker = `/object/public/${PHOTOS_BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const path = url.slice(idx + marker.length).split('?')[0]
      await supabase.storage.from(PHOTOS_BUCKET).remove([path])
    }

    const { error } = await supabase.from('resource_photos').delete().eq('id', photoId)
    if (error) throw error
  },
}
