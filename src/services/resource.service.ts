import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
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
  recibe_mujer, recibe_hombre, recibe_trans, pide_reserva, pide_referencias,
  pide_doc_identidad, pide_link_publicacion, acepta_parejas, recibe_agencias,
  tiene_camaras_seguridad, tiene_wifi, tiene_bano_privado, tiene_extintor,
  video_url,
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
  recibe_mujer, recibe_hombre, recibe_trans, pide_reserva, pide_referencias,
  pide_doc_identidad, pide_link_publicacion, acepta_parejas, recibe_agencias,
  tiene_camaras_seguridad, tiene_wifi, tiene_bano_privado, tiene_extintor,
  video_url,
  reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  city:cities!city_id(id, name, slug),
  photos:resource_photos(id, resource_id, url, sort_order, created_at)
`

const PHOTOS_BUCKET = 'resource-photos'
const VIDEOS_BUCKET = 'resource-videos'
const MAX_PHOTO_SIZE = 8 * 1024 * 1024 // antes de convertir a WebP
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const MAX_VIDEO_DURATION_SEC = 60
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const SIGNED_URL_TTL_SEC = 60 * 60 // 1 hora

function sortPhotos(resource: Resource): Resource {
  if (resource.photos) {
    resource.photos = [...resource.photos].sort((a, b) => a.sort_order - b.sort_order)
  }
  return resource
}

/** Extrae path de storage desde URL legacy o path relativo. */
function storagePathFromUrl(url: string, bucket = PHOTOS_BUCKET): string | null {
  if (!url) return null
  if (!url.startsWith('http')) return url.replace(/^\//, '')

  const markers = [
    `/object/public/${bucket}/`,
    `/object/sign/${bucket}/`,
    `/object/authenticated/${bucket}/`,
  ]
  for (const marker of markers) {
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
    }
  }
  return null
}

async function resolvePhotoUrls(photos: ResourcePhoto[] | undefined): Promise<ResourcePhoto[] | undefined> {
  if (!photos?.length) return photos

  const resolved = await Promise.all(
    photos.map(async (photo) => {
      const path = storagePathFromUrl(photo.url)
      if (!path) return photo

      const { data, error } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SEC)

      if (error || !data?.signedUrl) return photo
      return { ...photo, url: data.signedUrl }
    }),
  )
  return resolved
}

async function resolveVideoUrl(videoUrl: string | null | undefined): Promise<string | null> {
  if (!videoUrl) return null
  const path = storagePathFromUrl(videoUrl, VIDEOS_BUCKET)
  if (!path) return videoUrl

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC)

  if (error || !data?.signedUrl) return videoUrl
  return data.signedUrl
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer el video'))
    }
    video.src = url
  })
}

async function withSignedPhotos(resource: Resource): Promise<Resource> {
  const sorted = sortPhotos(resource)
  sorted.photos = await resolvePhotoUrls(sorted.photos)
  sorted.video_url = await resolveVideoUrl(sorted.video_url)
  return sorted
}

async function withSignedPhotosList(resources: Resource[]): Promise<Resource[]> {
  return Promise.all(resources.map(withSignedPhotos))
}

export const resourceService = {
  async getResources(params: {
    cityId?: string
    category?: ResourceCategory
    search?: string
    limit?: number
  }): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'aprobada')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.cityId) query = query.eq('city_id', params.cityId)
    if (params.category) query = query.eq('category', params.category)
    if (params.search?.trim()) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`,
      )
    }
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
  },

  async getPublicHabitacionCities(): Promise<
    { id: string; name: string; slug: string; count: number }[]
  > {
    const { data, error } = await supabase
      .from('resources')
      .select('city_id, city:cities!city_id(id, name, slug)')
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')

    if (error) throw error

    const counts = new Map<string, { id: string; name: string; slug: string; count: number }>()
    for (const row of (data ?? []) as unknown as Array<{
      city_id: string
      city: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null
    }>) {
      const raw = row.city
      const city = Array.isArray(raw) ? raw[0] : raw
      if (!city?.id) continue
      const prev = counts.get(city.id)
      if (prev) prev.count += 1
      else counts.set(city.id, { id: city.id, name: city.name, slug: city.slug, count: 1 })
    }

    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
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
    if (filters.tiene_bano_privado) query = query.eq('tiene_bano_privado', true)
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
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
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
    return data ? withSignedPhotos(data as unknown as Resource) : null
  },

  async getResourceById(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('id', resourceId)
      .maybeSingle()

    if (error) throw error
    return data ? withSignedPhotos(data as unknown as Resource) : null
  },

  async getMyResources(authorId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
  },

  async getPendingResources(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
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
    return withSignedPhotos(data as unknown as Resource)
  },

  async updateResource(resourceId: string, input: UpdateResourceInput): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(input)
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return withSignedPhotos(data as unknown as Resource)
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
    return withSignedPhotos(data as unknown as Resource)
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
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
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
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
  },

  async getHabitacionesForAdmin(params?: {
    search?: string
    cityId?: string
    /** Si false, solo activas. Default: todas (activas + pausadas). */
    onlyActive?: boolean
    limit?: number
  }): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('category', 'habitaciones_escort')
      .eq('status', 'aprobada')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })

    if (params?.onlyActive) query = query.eq('is_active', true)
    if (params?.cityId) query = query.eq('city_id', params.cityId)
    if (params?.search?.trim()) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }
    if (params?.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
  },

  async uploadResourcePhoto(
    resourceId: string,
    file: File,
    sortOrder = 0,
    options?: { isPublic?: boolean },
  ): Promise<ResourcePhoto> {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
    }
    if (file.size > MAX_PHOTO_SIZE) {
      throw new Error('La imagen no puede superar 8 MB antes de optimizar.')
    }

    const webp = await convertImageToWebp(file)
    const visibility = options?.isPublic ? 'public' : 'private'
    const path = `${visibility}/${resourceId}/${crypto.randomUUID()}.webp`

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, webp, { upsert: false, contentType: 'image/webp' })

    if (uploadError) throw uploadError

    // Guardamos el path relativo; al leer se firma con createSignedUrl
    const { data, error } = await supabase
      .from('resource_photos')
      .insert({ resource_id: resourceId, url: path, sort_order: sortOrder })
      .select('id, resource_id, url, sort_order, created_at')
      .single()

    if (error) throw error

    const signed = await resolvePhotoUrls([data as ResourcePhoto])
    return signed![0]
  },

  async deleteResourcePhoto(photoId: string, url: string): Promise<void> {
    const path = storagePathFromUrl(url)
    if (path) {
      await supabase.storage.from(PHOTOS_BUCKET).remove([path])
    }

    const { error } = await supabase.from('resource_photos').delete().eq('id', photoId)
    if (error) throw error
  },

  async uploadResourceVideo(
    resourceId: string,
    file: File,
    options?: { isPublic?: boolean },
  ): Promise<Resource> {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error('Formato de video no permitido. Usa MP4, WebM o MOV.')
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error('El video no puede superar 50 MB.')
    }

    const duration = await getVideoDuration(file)
    if (duration > MAX_VIDEO_DURATION_SEC) {
      throw new Error('El video no puede superar 60 segundos.')
    }

    // Quitar video anterior si existe
    const current = await this.getResourceById(resourceId)
    if (current?.video_url) {
      const oldPath = storagePathFromUrl(current.video_url, VIDEOS_BUCKET)
      if (oldPath) {
        await supabase.storage.from(VIDEOS_BUCKET).remove([oldPath])
      }
    }

    const ext =
      file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4'
    const visibility = options?.isPublic ? 'public' : 'private'
    const path = `${visibility}/${resourceId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type || 'video/mp4' })

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('resources')
      .update({ video_url: path })
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return withSignedPhotos(data as unknown as Resource)
  },

  async deleteResourceVideo(resourceId: string, videoUrl: string): Promise<Resource> {
    const path = storagePathFromUrl(videoUrl, VIDEOS_BUCKET)
    if (path) {
      await supabase.storage.from(VIDEOS_BUCKET).remove([path])
    }

    const { data, error } = await supabase
      .from('resources')
      .update({ video_url: null })
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return withSignedPhotos(data as unknown as Resource)
  },
}
