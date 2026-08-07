import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
import {
  parseHabitacionesCsv,
  type HabitacionCsvCity,
  type HabitacionCsvParseError,
} from '@/lib/habitacion-csv-import'
import {
  FEATURED_HABITACIONES_LIMIT,
  FEATURED_HABITACIONES_POOL,
} from '@/lib/habitaciones'
import type { ResourceCategory } from '@/types/database'
import type {
  CreateResourceInput,
  PublicHabitacionFilters,
  Resource,
  ResourcePhoto,
  ReviewResourceInput,
  UpdateResourceInput,
} from '@/types/resources'

export type HabitacionCsvImportResult = {
  created: number
  createdNames: string[]
  errors: HabitacionCsvParseError[]
}

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

/** Listado/cards: cover (1ª foto) + video_url para casas solo-video. */
const PUBLIC_HABITACION_CARD_SELECT = `
  id, city_id, category, status, name,
  phone, address, whatsapp_phone, contact_phone,
  rating_avg, reviews_count, is_verified, is_active, is_public,
  recibe_mujer, recibe_hombre, recibe_trans, pide_reserva,
  acepta_parejas, tiene_wifi, tiene_bano_privado,
  video_url,
  created_at, updated_at,
  city:cities!city_id(id, name, slug),
  photos:resource_photos(id, resource_id, url, sort_order, created_at).order(sort_order.asc).limit(1)
`

const PHOTOS_BUCKET = 'resource-photos'
const VIDEOS_BUCKET = 'resource-videos'
const MAX_PHOTO_SIZE = 8 * 1024 * 1024 // antes de convertir a WebP
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const MAX_VIDEO_DURATION_SEC = 60
const MAX_HABITACION_PHOTOS = 10
const DEFAULT_PUBLIC_LIST_LIMIT = 24
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const SIGNED_URL_TTL_SEC = 60 * 60 // 1 hora
const SIGNED_VIDEO_TTL_SEC = 30 * 60 // 30 min — reduce ventana de descarga

function escapeIlike(value: string): string {
  return value.replace(/[%_,.()\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

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

  const withPaths = photos.map((photo) => ({
    photo,
    path: storagePathFromUrl(photo.url),
  }))

  const paths = [
    ...new Set(withPaths.map((p) => p.path).filter((p): p is string => !!p)),
  ]
  if (paths.length === 0) return []

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC)

  if (error || !data) return []

  const urlByPath = new Map<string, string>()
  for (const row of data) {
    if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl)
  }

  return withPaths
    .map(({ photo, path }) => {
      if (!path) return null
      const signedUrl = urlByPath.get(path)
      if (!signedUrl) return null
      return { ...photo, url: signedUrl }
    })
    .filter((p): p is ResourcePhoto => p !== null)
}

async function resolveVideoUrl(videoUrl: string | null | undefined): Promise<string | null> {
  if (!videoUrl) return null
  const path = storagePathFromUrl(videoUrl, VIDEOS_BUCKET)
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(path, SIGNED_VIDEO_TTL_SEC)

  if (error || !data?.signedUrl) return null
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

/** Listado: firma covers (fotos) y, si no hay foto, el video en batch. */
async function withSignedCovers(resources: Resource[]): Promise<Resource[]> {
  const prepared = resources.map((resource) => {
    const sorted = sortPhotos({
      ...resource,
      photos: resource.photos ? [...resource.photos] : [],
    })
    const cover = sorted.photos?.[0] ?? null
    const path = cover ? storagePathFromUrl(cover.url) : null
    const videoPath = sorted.video_url
      ? storagePathFromUrl(sorted.video_url, VIDEOS_BUCKET)
      : null
    return { resource: sorted, cover, path, videoPath }
  })

  const paths = [...new Set(prepared.map((p) => p.path).filter((p): p is string => !!p))]
  const urlByPath = new Map<string, string>()

  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SEC)
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl)
    }
  }

  const withPhotos = prepared.map(({ resource, cover, path, videoPath }) => {
    const hasCover = !!(cover && path && urlByPath.has(path))
    if (hasCover) {
      resource.photos = [{ ...cover!, url: urlByPath.get(path!)! }]
      resource.video_url = null
      return { resource, videoPath: null as string | null }
    }
    resource.photos = []
    return { resource, videoPath: videoPath && resource.video_url ? videoPath : null }
  })

  const videoPaths = [
    ...new Set(withPhotos.map((p) => p.videoPath).filter((p): p is string => !!p)),
  ]
  const videoUrlByPath = new Map<string, string>()

  if (videoPaths.length > 0) {
    const { data } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .createSignedUrls(videoPaths, SIGNED_VIDEO_TTL_SEC)
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) videoUrlByPath.set(row.path, row.signedUrl)
    }
  }

  return withPhotos.map(({ resource, videoPath }) => {
    if (videoPath && videoUrlByPath.has(videoPath)) {
      resource.video_url = videoUrlByPath.get(videoPath)!
    } else {
      resource.video_url = null
    }
    return resource
  })
}

/** Mezcla Fisher–Yates — orden aleatorio en cada carga de /home. */
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

async function withSignedPhotosList(resources: Resource[]): Promise<Resource[]> {
  return Promise.all(resources.map(withSignedPhotos))
}

async function moveStorageObject(
  bucket: string,
  fromPath: string,
  toPath: string,
): Promise<boolean> {
  if (fromPath === toPath) return true
  const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(fromPath)
  if (dlError || !blob) return false

  const { error: upError } = await supabase.storage
    .from(bucket)
    .upload(toPath, blob, { upsert: true, contentType: blob.type || undefined })
  if (upError) return false

  await supabase.storage.from(bucket).remove([fromPath])
  return true
}

function swapVisibilityPrefix(path: string, visibility: 'public' | 'private'): string | null {
  const parts = path.split('/')
  if (parts.length < 2) return null
  if (parts[0] !== 'public' && parts[0] !== 'private') return null
  if (parts[0] === visibility) return path
  return [visibility, ...parts.slice(1)].join('/')
}

export const resourceService = {
  async getResources(params: {
    cityId?: string
    category?: ResourceCategory
    search?: string
    limit?: number
    offset?: number
  }): Promise<Resource[]> {
    const limit = params.limit ?? DEFAULT_PUBLIC_LIST_LIMIT
    const offset = params.offset ?? 0
    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'aprobada')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.cityId) query = query.eq('city_id', params.cityId)
    if (params.category) query = query.eq('category', params.category)
    if (params.search?.trim()) {
      const q = escapeIlike(params.search)
      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error
    // Cards solo necesitan cover — evita N×M createSignedUrl
    return withSignedCovers((data ?? []) as unknown as Resource[])
  },

  async getResourcesPage(params: {
    cityId?: string
    cityIds?: string[]
    category?: ResourceCategory
    search?: string
    recibe_mujer?: boolean
    recibe_hombre?: boolean
    recibe_trans?: boolean
    acepta_parejas?: boolean
    limit?: number
    offset?: number
  }): Promise<{ items: Resource[]; total: number }> {
    const limit = params.limit ?? DEFAULT_PUBLIC_LIST_LIMIT
    const offset = params.offset ?? 0

    if (params.cityIds && params.cityIds.length === 0) {
      return { items: [], total: 0 }
    }

    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT, { count: 'exact' })
      .eq('status', 'aprobada')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (params.cityId) query = query.eq('city_id', params.cityId)
    else if (params.cityIds?.length) query = query.in('city_id', params.cityIds)
    if (params.category) query = query.eq('category', params.category)
    if (params.recibe_mujer) query = query.eq('recibe_mujer', true)
    if (params.recibe_hombre) query = query.eq('recibe_hombre', true)
    if (params.recibe_trans) query = query.eq('recibe_trans', true)
    if (params.acepta_parejas) query = query.eq('acepta_parejas', true)
    if (params.search?.trim()) {
      const q = escapeIlike(params.search)
      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error, count } = await query
    if (error) throw error
    const items = await withSignedCovers((data ?? []) as unknown as Resource[])
    return { items, total: count ?? 0 }
  },

  async getPublicHabitacionCities(): Promise<
    { id: string; name: string; slug: string; count: number }[]
  > {
    const { data, error } = await supabase.rpc('get_public_habitacion_cities')

    if (!error && data) {
      return (data as Array<{ id: string; name: string; slug: string; count: number | string }>).map(
        (row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          count: Number(row.count),
        }),
      )
    }

    // Fallback acotado si el RPC aún no está aplicado (evita cargar la tabla entera)
    const { data: rows, error: fallbackError } = await supabase
      .from('resources')
      .select('city_id, city:cities!city_id(id, name, slug)')
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')
      .limit(800)

    if (fallbackError) throw fallbackError

    const counts = new Map<string, { id: string; name: string; slug: string; count: number }>()
    for (const row of (rows ?? []) as unknown as Array<{
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
    const limit = filters.limit ?? DEFAULT_PUBLIC_LIST_LIMIT
    const offset = filters.offset ?? 0

    let query = supabase
      .from('resources')
      .select(PUBLIC_HABITACION_CARD_SELECT)
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters.cityId) query = query.eq('city_id', filters.cityId)
    if (filters.tiene_wifi) query = query.eq('tiene_wifi', true)
    if (filters.tiene_bano_privado) query = query.eq('tiene_bano_privado', true)
    if (filters.pide_reserva) query = query.eq('pide_reserva', true)
    if (filters.acepta_parejas) query = query.eq('acepta_parejas', true)
    if (filters.search?.trim()) {
      const q = escapeIlike(filters.search)
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`)
      }
    }

    const { data, error } = await query
    if (error) throw error
    return withSignedCovers((data ?? []) as unknown as Resource[])
  },

  /**
   * Top N públicas al azar para el carrusel Destacadas (/home).
   * Cada llamada remueve el orden (nueva visita / refetch).
   */
  async getFeaturedPublicHabitaciones(
    limit = FEATURED_HABITACIONES_LIMIT,
  ): Promise<Resource[]> {
    const pool = Math.max(limit, FEATURED_HABITACIONES_POOL)
    const { data, error } = await supabase
      .from('resources')
      .select(PUBLIC_HABITACION_CARD_SELECT)
      .eq('category', 'habitaciones_escort')
      .eq('is_public', true)
      .eq('is_active', true)
      .eq('status', 'aprobada')
      .order('created_at', { ascending: false })
      .limit(pool)

    if (error) throw error
    const signed = await withSignedCovers((data ?? []) as unknown as Resource[])
    return shuffleArray(signed).slice(0, limit)
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

  /** Favoritas del perfil — mantiene orden de ids y firma covers. */
  async getHabitacionesByIds(ids: string[]): Promise<Resource[]> {
    if (!ids.length) return []

    const { data, error } = await supabase
      .from('resources')
      .select(PUBLIC_HABITACION_CARD_SELECT)
      .in('id', ids)
      .eq('category', 'habitaciones_escort')
      .eq('status', 'aprobada')
      .eq('is_active', true)

    if (error) throw error

    const signed = await withSignedCovers((data ?? []) as unknown as Resource[])
    const byId = new Map(signed.map((r) => [r.id, r]))
    return ids.map((id) => byId.get(id)).filter((r): r is Resource => !!r)
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

  async createResource(
    authorId: string,
    input: CreateResourceInput,
    options?: { publishImmediately?: boolean },
  ): Promise<Resource> {
    const publishImmediately = options?.publishImmediately ?? true
    const status =
      input.category === 'habitaciones_escort' && !publishImmediately
        ? 'pendiente'
        : 'aprobada'

    const { data, error } = await supabase
      .from('resources')
      .insert({ ...input, author_id: authorId, status })
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return withSignedPhotos(data as unknown as Resource)
  },

  async updateResource(resourceId: string, input: UpdateResourceInput): Promise<Resource> {
    let previousIsPublic: boolean | null = null
    if (typeof input.is_public === 'boolean') {
      const { data: prev, error: prevError } = await supabase
        .from('resources')
        .select('is_public')
        .eq('id', resourceId)
        .maybeSingle()
      if (prevError) throw prevError
      previousIsPublic = prev?.is_public ?? null
    }

    const { data, error } = await supabase
      .from('resources')
      .update(input)
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error

    if (
      typeof input.is_public === 'boolean' &&
      previousIsPublic !== null &&
      previousIsPublic !== input.is_public
    ) {
      await resourceService.syncHabitacionMediaVisibility(resourceId, input.is_public)
      const refreshed = await resourceService.getResourceById(resourceId)
      if (refreshed) return refreshed
    }

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
    const { data: photos } = await supabase
      .from('resource_photos')
      .select('url')
      .eq('resource_id', resourceId)

    const { data: resource } = await supabase
      .from('resources')
      .select('video_url')
      .eq('id', resourceId)
      .maybeSingle()

    const photoPaths = (photos ?? [])
      .map((p) => storagePathFromUrl(p.url))
      .filter((p): p is string => !!p)
    if (photoPaths.length > 0) {
      await supabase.storage.from(PHOTOS_BUCKET).remove(photoPaths)
    }

    const videoPath = resource?.video_url
      ? storagePathFromUrl(resource.video_url, VIDEOS_BUCKET)
      : null
    if (videoPath) {
      await supabase.storage.from(VIDEOS_BUCKET).remove([videoPath])
    }

    const { error } = await supabase.from('resources').delete().eq('id', resourceId)
    if (error) throw error
  },

  /** Mueve fotos/video entre prefijos public/ y private/ al cambiar visibilidad. */
  async syncHabitacionMediaVisibility(resourceId: string, isPublic: boolean): Promise<void> {
    const visibility = isPublic ? 'public' : 'private'

    const { data: photos } = await supabase
      .from('resource_photos')
      .select('id, url')
      .eq('resource_id', resourceId)

    for (const photo of photos ?? []) {
      const path = storagePathFromUrl(photo.url)
      if (!path) continue
      const next = swapVisibilityPrefix(path, visibility)
      if (!next || next === path) continue
      const ok = await moveStorageObject(PHOTOS_BUCKET, path, next)
      if (ok) {
        await supabase.from('resource_photos').update({ url: next }).eq('id', photo.id)
      }
    }

    const { data: resource } = await supabase
      .from('resources')
      .select('video_url')
      .eq('id', resourceId)
      .maybeSingle()

    if (resource?.video_url) {
      const path = storagePathFromUrl(resource.video_url, VIDEOS_BUCKET)
      if (path) {
        const next = swapVisibilityPrefix(path, visibility)
        if (next && next !== path) {
          const ok = await moveStorageObject(VIDEOS_BUCKET, path, next)
          if (ok) {
            await supabase.from('resources').update({ video_url: next }).eq('id', resourceId)
          }
        }
      }
    }
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
      const q = escapeIlike(params.search)
      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }
    if (params?.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return withSignedPhotosList((data ?? []) as unknown as Resource[])
  },

  async getHabitacionesForAdmin(params?: {
    search?: string
    cityId?: string
    /** Si true, solo activas. */
    onlyActive?: boolean
    /** Si true, solo pausadas. */
    onlyPaused?: boolean
    /** pendiente | aprobada | all (default aprobada para listados legacy). */
    reviewStatus?: 'pendiente' | 'aprobada' | 'all'
    /** Ciudades para resolver búsqueda por nombre de ciudad. */
    cities?: Array<{ id: string; name: string }>
    page?: number
    pageSize?: number
    limit?: number
  }): Promise<{ items: Resource[]; total: number }> {
    const pageSize = params?.pageSize ?? params?.limit ?? 10
    const page = Math.max(1, params?.page ?? 1)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const reviewStatus = params?.reviewStatus ?? 'aprobada'

    let query = supabase
      .from('resources')
      .select(RESOURCE_SELECT, { count: 'exact' })
      .eq('category', 'habitaciones_escort')

    if (reviewStatus === 'pendiente') query = query.eq('status', 'pendiente')
    else if (reviewStatus === 'aprobada') query = query.eq('status', 'aprobada')
    else query = query.in('status', ['pendiente', 'aprobada'])

    query = query
      .order('status', { ascending: true })
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (params?.onlyActive) query = query.eq('is_active', true)
    if (params?.onlyPaused) query = query.eq('is_active', false)
    if (params?.cityId) query = query.eq('city_id', params.cityId)

    if (params?.search?.trim()) {
      const raw = params.search.trim()
      const q = escapeIlike(raw)
      const digits = raw.replace(/\D/g, '')
      const cityIds =
        params.cities
          ?.filter((c) => c.name.toLowerCase().includes(raw.toLowerCase()))
          .map((c) => c.id) ?? []

      if (q) {
        const parts = [
          `name.ilike.%${q}%`,
          `description.ilike.%${q}%`,
          `address.ilike.%${q}%`,
          `whatsapp_phone.ilike.%${q}%`,
          `contact_phone.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
        ]
        if (digits.length >= 4) {
          parts.push(`whatsapp_phone.ilike.%${digits}%`)
          parts.push(`contact_phone.ilike.%${digits}%`)
          parts.push(`phone.ilike.%${digits}%`)
        }
        if (cityIds.length > 0) {
          parts.push(`city_id.in.(${cityIds.join(',')})`)
        }
        query = query.or(parts.join(','))
      }
    }

    const { data, error, count } = await query
    if (error) throw error
    return {
      items: await withSignedPhotosList((data ?? []) as unknown as Resource[]),
      total: count ?? 0,
    }
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

    const { count, error: countError } = await supabase
      .from('resource_photos')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resourceId)
    if (countError) throw countError
    if ((count ?? 0) >= MAX_HABITACION_PHOTOS) {
      throw new Error(`Máximo ${MAX_HABITACION_PHOTOS} fotos por habitación.`)
    }

    const webp = await convertImageToWebp(file, { watermark: false })
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

  /**
   * Importa habitaciones desde CSV (plantilla docs/plantilla-import-casas.csv).
   * Crea fila a fila; errores de parseo/insert no detienen el resto.
   */
  async importHabitacionesFromCsv(
    authorId: string,
    csvText: string,
    cities: HabitacionCsvCity[],
  ): Promise<HabitacionCsvImportResult> {
    const parsed = parseHabitacionesCsv(csvText, cities)
    const errors = [...parsed.errors]
    const createdNames: string[] = []

    for (const row of parsed.rows) {
      const { rowNumber, ...input } = row
      try {
        const created = await resourceService.createResource(authorId, input)
        createdNames.push(created.name)
      } catch (err) {
        errors.push({
          row: rowNumber,
          message:
            err instanceof Error
              ? `No se pudo crear "${input.name}": ${err.message}`
              : `No se pudo crear "${input.name}"`,
        })
      }
    }

    return {
      created: createdNames.length,
      createdNames,
      errors,
    }
  },
}
