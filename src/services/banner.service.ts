import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
import type { CreateHomeBannerInput, HomeBanner, UpdateHomeBannerInput } from '@/types/admin'

const SELECT =
  'id, title, link_url, image_url, is_active, sort_order, created_at, updated_at'

const BUCKET = 'home-banners'
const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const bannerService = {
  async listActive(): Promise<HomeBanner[]> {
    const { data, error } = await supabase
      .from('home_banners')
      .select(SELECT)
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as HomeBanner[]
  },

  async listAll(): Promise<HomeBanner[]> {
    const { data, error } = await supabase
      .from('home_banners')
      .select(SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as HomeBanner[]
  },

  async create(input: CreateHomeBannerInput): Promise<HomeBanner> {
    const payload = {
      title: input.title.trim(),
      link_url: input.link_url?.trim() || null,
      image_url: input.image_url ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    }

    const { data, error } = await supabase
      .from('home_banners')
      .insert(payload)
      .select(SELECT)
      .single()

    if (error) throw error
    return data as HomeBanner
  },

  async update(id: string, input: UpdateHomeBannerInput): Promise<HomeBanner> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.title !== undefined) payload.title = input.title.trim()
    if (input.link_url !== undefined) payload.link_url = input.link_url?.trim() || null
    if (input.image_url !== undefined) payload.image_url = input.image_url
    if (input.is_active !== undefined) payload.is_active = input.is_active
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order

    const { data, error } = await supabase
      .from('home_banners')
      .update(payload)
      .eq('id', id)
      .select(SELECT)
      .single()

    if (error) throw error
    return data as HomeBanner
  },

  async delete(id: string): Promise<void> {
    const { data: row } = await supabase
      .from('home_banners')
      .select('image_url')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase.from('home_banners').delete().eq('id', id)
    if (error) throw error

    if (row?.image_url) {
      await bannerService.removeImageObject(id).catch(() => undefined)
    }
  },

  async uploadImage(bannerId: string, file: File): Promise<HomeBanner> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('La imagen no puede superar 3 MB.')
    }

    const webp = await convertImageToWebp(file, {
      maxEdge: 1200,
      quality: 0.82,
      maxOutputBytes: 60 * 1024,
    })
    const path = `${bannerId}/banner.webp`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, webp, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '31536000',
      })

    if (uploadError) throw uploadError

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const imageUrl = pub.publicUrl

    return bannerService.update(bannerId, { image_url: imageUrl })
  },

  async removeImage(bannerId: string): Promise<HomeBanner> {
    await bannerService.removeImageObject(bannerId)
    return bannerService.update(bannerId, { image_url: null })
  },

  async removeImageObject(bannerId: string): Promise<void> {
    await supabase.storage.from(BUCKET).remove([`${bannerId}/banner.webp`])
  },
}
