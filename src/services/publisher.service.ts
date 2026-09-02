import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
import { normalizePhoneChile } from '@/lib/phone'
import type {
  CreateRecommendedPublisherInput,
  RecommendedPublisher,
  UpdateRecommendedPublisherInput,
} from '@/types/admin'

const SELECT =
  'id, name, whatsapp, note, logo_url, is_active, sort_order, created_at, updated_at'

const LOGO_BUCKET = 'publisher-logos'
const MAX_LOGO_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function normalizeWhatsapp(phone: string): string {
  return normalizePhoneChile(phone)
}

export const publisherService = {
  async listActive(): Promise<RecommendedPublisher[]> {
    const { data, error } = await supabase
      .from('recommended_publishers')
      .select(SELECT)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as RecommendedPublisher[]
  },

  async listAll(): Promise<RecommendedPublisher[]> {
    const { data, error } = await supabase
      .from('recommended_publishers')
      .select(SELECT)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as RecommendedPublisher[]
  },

  async create(input: CreateRecommendedPublisherInput): Promise<RecommendedPublisher> {
    const payload = {
      name: input.name.trim(),
      whatsapp: normalizeWhatsapp(input.whatsapp),
      note: input.note?.trim() || null,
      logo_url: input.logo_url ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    }

    const { data, error } = await supabase
      .from('recommended_publishers')
      .insert(payload)
      .select(SELECT)
      .single()

    if (error) throw error
    return data as RecommendedPublisher
  },

  async update(
    id: string,
    input: UpdateRecommendedPublisherInput,
  ): Promise<RecommendedPublisher> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.whatsapp !== undefined) payload.whatsapp = normalizeWhatsapp(input.whatsapp)
    if (input.note !== undefined) payload.note = input.note?.trim() || null
    if (input.logo_url !== undefined) payload.logo_url = input.logo_url
    if (input.is_active !== undefined) payload.is_active = input.is_active
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order

    const { data, error } = await supabase
      .from('recommended_publishers')
      .update(payload)
      .eq('id', id)
      .select(SELECT)
      .single()

    if (error) throw error
    return data as RecommendedPublisher
  },

  async delete(id: string): Promise<void> {
    const { data: row } = await supabase
      .from('recommended_publishers')
      .select('logo_url')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase.from('recommended_publishers').delete().eq('id', id)
    if (error) throw error

    if (row?.logo_url) {
      await publisherService.removeLogoObject(id).catch(() => undefined)
    }
  },

  /** Sube logo WebP y actualiza logo_url. Paths: {id}/logo.webp */
  async uploadLogo(publisherId: string, file: File): Promise<RecommendedPublisher> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
    }
    if (file.size > MAX_LOGO_SIZE) {
      throw new Error('La imagen no puede superar 2 MB.')
    }

    const webp = await convertImageToWebp(file, {
      maxEdge: 160,
      quality: 0.82,
      maxOutputBytes: 48 * 1024,
    })
    const path = `${publisherId}/logo.webp`

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, webp, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '31536000',
      })

    if (uploadError) throw uploadError

    const { data: pub } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
    const logoUrl = pub.publicUrl

    return publisherService.update(publisherId, { logo_url: logoUrl })
  },

  async removeLogo(publisherId: string): Promise<RecommendedPublisher> {
    await publisherService.removeLogoObject(publisherId)
    return publisherService.update(publisherId, { logo_url: null })
  },

  async removeLogoObject(publisherId: string): Promise<void> {
    await supabase.storage.from(LOGO_BUCKET).remove([`${publisherId}/logo.webp`])
  },
}
