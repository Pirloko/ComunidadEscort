import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
import type { AlertCategory } from '@/types/database'
import type { Alert, AlertMedia, CreateAlertInput, ReviewAlertInput } from '@/types/alerts'

const MEDIA_BUCKET = 'alert-media'
const SIGNED_URL_TTL_SEC = 3600

const ALERT_SELECT = `
  id, author_id, city_id, category, status, title, description,
  location_detail, report_kind, client_number, category_other, city_other,
  rating, treatment_notes, hygiene_notes,
  reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug),
  media:alert_media(id, alert_id, kind, storage_path, sort_order, duration_sec, created_at)
`

async function signMedia(media: AlertMedia[] | null | undefined): Promise<AlertMedia[]> {
  if (!media?.length) return []
  const out: AlertMedia[] = []
  for (const item of media) {
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(item.storage_path, SIGNED_URL_TTL_SEC)
    out.push({ ...item, url: data?.signedUrl })
  }
  return out.sort((a, b) => a.sort_order - b.sort_order)
}

async function enrichAlert(alert: Alert): Promise<Alert> {
  return { ...alert, media: await signMedia(alert.media) }
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

export const alertService = {
  async getApprovedAlerts(params: {
    cityId?: string
    category?: AlertCategory
    search?: string
    /** Busca por número de cliente (parcial; ignora espacios/símbolos) */
    clientPhone?: string
    limit?: number
  }): Promise<Alert[]> {
    let query = supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('status', 'aprobada')
      .order('created_at', { ascending: false })

    if (params.cityId) query = query.eq('city_id', params.cityId)
    if (params.category) query = query.eq('category', params.category)
    if (params.search?.trim()) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    let rows = (data ?? []) as unknown as Alert[]

    // Filtrar por dígitos (ignora espacios/+56 en lo guardado y en lo buscado)
    const phoneDigits = params.clientPhone?.replace(/[^\d]/g, '') ?? ''
    if (phoneDigits.length >= 4) {
      rows = rows.filter((a) => {
        const stored = (a.client_number ?? '').replace(/[^\d]/g, '')
        return stored.includes(phoneDigits)
      })
    }

    return Promise.all(rows.map(enrichAlert))
  },

  async getAlertById(alertId: string): Promise<Alert | null> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('id', alertId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return enrichAlert(data as unknown as Alert)
  },

  async getMyAlerts(authorId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return Promise.all(((data ?? []) as unknown as Alert[]).map(enrichAlert))
  },

  async getPendingAlerts(): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return Promise.all(((data ?? []) as unknown as Alert[]).map(enrichAlert))
  },

  async getApprovedCount(cityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('status', 'aprobada')

    if (error) throw error
    return count ?? 0
  },

  async createAlert(authorId: string, input: CreateAlertInput): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .insert({ ...input, author_id: authorId, status: 'pendiente' })
      .select(ALERT_SELECT)
      .single()

    if (error) throw error
    return enrichAlert(data as unknown as Alert)
  },

  async uploadAlertMedia(
    alertId: string,
    files: { images: File[]; video: File | null },
  ): Promise<void> {
    if (files.images.length > 3) throw new Error('Máximo 3 fotos')
    let sort = 0

    for (const file of files.images) {
      const webp = await convertImageToWebp(file, { maxOutputBytes: 2_500_000 })
      const path = `${alertId}/${crypto.randomUUID()}.webp`
      const { error: upError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, webp, { contentType: 'image/webp', upsert: false })
      if (upError) throw upError

      const { error } = await supabase.from('alert_media').insert({
        alert_id: alertId,
        kind: 'image',
        storage_path: path,
        sort_order: sort++,
      })
      if (error) throw error
    }

    if (files.video) {
      const duration = await getVideoDuration(files.video)
      if (duration > 20.05) {
        throw new Error('El video no puede superar 20 segundos')
      }
      const ext = files.video.name.split('.').pop()?.toLowerCase() || 'mp4'
      const path = `${alertId}/${crypto.randomUUID()}.${ext}`
      const { error: upError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, files.video, {
          contentType: files.video.type || 'video/mp4',
          upsert: false,
        })
      if (upError) throw upError

      const { error } = await supabase.from('alert_media').insert({
        alert_id: alertId,
        kind: 'video',
        storage_path: path,
        sort_order: sort,
        duration_sec: Math.round(duration * 10) / 10,
      })
      if (error) throw error
    }
  },

  async updatePendingAlert(
    alertId: string,
    input: Partial<CreateAlertInput>,
  ): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .update(input)
      .eq('id', alertId)
      .eq('status', 'pendiente')
      .select(ALERT_SELECT)
      .single()

    if (error) throw error
    return enrichAlert(data as unknown as Alert)
  },

  async reviewAlert(
    alertId: string,
    reviewerId: string,
    input: ReviewAlertInput,
  ): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: input.status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: input.status === 'rechazada' ? input.rejection_reason : null,
      })
      .eq('id', alertId)
      .select(ALERT_SELECT)
      .single()

    if (error) throw error
    return enrichAlert(data as unknown as Alert)
  },

  async deleteAlert(alertId: string): Promise<void> {
    const { data: media } = await supabase
      .from('alert_media')
      .select('storage_path')
      .eq('alert_id', alertId)

    const paths = (media ?? []).map((m) => m.storage_path as string)
    if (paths.length > 0) {
      await supabase.storage.from(MEDIA_BUCKET).remove(paths)
    }

    const { error } = await supabase.from('alerts').delete().eq('id', alertId)
    if (error) throw error
  },
}
