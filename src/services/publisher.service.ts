import { supabase } from '@/lib/supabase/client'
import { normalizePhoneChile } from '@/lib/phone'
import type {
  CreateRecommendedPublisherInput,
  RecommendedPublisher,
  UpdateRecommendedPublisherInput,
} from '@/types/admin'

const SELECT =
  'id, name, whatsapp, note, is_active, sort_order, created_at, updated_at'

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
    const { error } = await supabase.from('recommended_publishers').delete().eq('id', id)
    if (error) throw error
  },
}
