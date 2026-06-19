import { supabase } from '@/lib/supabase/client'
import type { City, Region } from '@/types/database'
import type { AdminCity, CreateCityInput, UpdateCityInput } from '@/types/admin'

const CITY_ADMIN_SELECT =
  'id, name, slug, region_id, is_active, created_at, region:regions!region_id(id, name, code)'

export const cityService = {
  async getPublicCities(): Promise<City[]> {
    const { data, error } = await supabase.rpc('get_public_cities')
    if (error) throw error
    return (data ?? []) as City[]
  },

  async isAliasAvailable(alias: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_alias_available', { p_alias: alias })
    if (error) throw error
    return data as boolean
  },

  async getAllCities(): Promise<AdminCity[]> {
    const { data, error } = await supabase
      .from('cities')
      .select(CITY_ADMIN_SELECT)
      .order('name')

    if (error) throw error
    return (data ?? []) as unknown as AdminCity[]
  },

  async getRegions(): Promise<Region[]> {
    const { data, error } = await supabase
      .from('regions')
      .select('id, name, code')
      .order('name')

    if (error) throw error
    return (data ?? []) as Region[]
  },

  async createCity(input: CreateCityInput): Promise<AdminCity> {
    const { data, error } = await supabase
      .from('cities')
      .insert(input)
      .select(CITY_ADMIN_SELECT)
      .single()

    if (error) throw error
    return data as unknown as AdminCity
  },

  async updateCity(cityId: string, input: UpdateCityInput): Promise<AdminCity> {
    const { data, error } = await supabase
      .from('cities')
      .update(input)
      .eq('id', cityId)
      .select(CITY_ADMIN_SELECT)
      .single()

    if (error) throw error
    return data as unknown as AdminCity
  },
}
