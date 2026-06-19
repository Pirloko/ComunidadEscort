import { supabase } from '@/lib/supabase/client'
import type { AlertCategory } from '@/types/database'
import type { Alert, CreateAlertInput, ReviewAlertInput } from '@/types/alerts'

const ALERT_SELECT = `
  id, author_id, city_id, category, status, title, description,
  location_detail, reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

export const alertService = {
  async getApprovedAlerts(params: {
    cityId: string
    category?: AlertCategory
    search?: string
    limit?: number
  }): Promise<Alert[]> {
    let query = supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('city_id', params.cityId)
      .eq('status', 'aprobada')
      .order('created_at', { ascending: false })

    if (params.category) query = query.eq('category', params.category)
    if (params.search?.trim()) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }
    if (params.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as Alert[]
  },

  async getAlertById(alertId: string): Promise<Alert | null> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('id', alertId)
      .maybeSingle()

    if (error) throw error
    return data as unknown as Alert | null
  },

  async getMyAlerts(authorId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as Alert[]
  },

  async getPendingAlerts(): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select(ALERT_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as Alert[]
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
    return data as unknown as Alert
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
    return data as unknown as Alert
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
    return data as unknown as Alert
  },

  async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase.from('alerts').delete().eq('id', alertId)
    if (error) throw error
  },
}
