import { supabase } from '@/lib/supabase/client'
import type { ResourceCategory } from '@/types/database'
import type {
  CreateResourceInput,
  Resource,
  ReviewResourceInput,
  UpdateResourceInput,
} from '@/types/resources'

const RESOURCE_SELECT = `
  id, author_id, city_id, category, status, name, description,
  phone, address, website, latitude, longitude, google_maps_url,
  instagram_url, facebook_url, whatsapp_phone, rating_avg, reviews_count,
  is_verified, is_active,
  reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

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
    return (data ?? []) as unknown as Resource[]
  },

  async getResourceById(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('id', resourceId)
      .maybeSingle()

    if (error) throw error
    return data as unknown as Resource
  },

  async getMyResources(authorId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as Resource[]
  },

  async getPendingResources(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(RESOURCE_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as Resource[]
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
    return data as unknown as Resource
  },

  async updateResource(resourceId: string, input: UpdateResourceInput): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(input)
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Resource
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
    return data as unknown as Resource
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
    return (data ?? []) as unknown as Resource[]
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
    return (data ?? []) as unknown as Resource[]
  },
}
