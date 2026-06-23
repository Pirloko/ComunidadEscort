import { supabase } from '@/lib/supabase/client'
import type { PrivacySettings, Profile, PublicProfile, UserRole } from '@/types/database'
import type {
  AdminProfile,
  CreateUserAsAdminInput,
  CreateUserAsAdminResult,
  ReviewAccountInput,
} from '@/types/admin'

const OWN_PROFILE_COLUMNS =
  'id, alias, city_id, avatar_url, description, privacy_settings, publication_link, phone, account_status, rejection_reason, role, is_active, must_change_password, last_seen_at, created_at, updated_at, email'

const OWN_PROFILE_FALLBACK_COLUMNS =
  'id, alias, city_id, avatar_url, description, privacy_settings, role, is_active, last_seen_at, created_at, updated_at, email'

function normalizeOwnProfile(data: Record<string, unknown>): Profile {
  const isActive = Boolean(data.is_active)
  const accountStatus = data.account_status as Profile['account_status'] | undefined

  return {
    ...(data as unknown as Profile),
    publication_link: (data.publication_link as string | null) ?? null,
    rejection_reason: (data.rejection_reason as string | null) ?? null,
    account_status:
      accountStatus ??
      (isActive ? 'aprobada' : 'pendiente'),
  }
}

const PUBLIC_PROFILE_COLUMNS =
  'id, alias, city_id, avatar_url, description, privacy_settings, created_at'

const ADMIN_PROFILE_COLUMNS =
  'id, alias, email, phone, city_id, role, is_active, account_status, publication_link, rejection_reason, reviewed_at, created_at, city:cities!city_id(id, name)'

export interface UpdateProfileInput {
  alias?: string
  city_id?: string | null
  description?: string | null
  avatar_url?: string | null
  privacy_settings?: PrivacySettings
}

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const profileService = {
  async getOwnProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select(OWN_PROFILE_COLUMNS)
      .eq('id', userId)
      .single()

    if (!error && data) {
      return normalizeOwnProfile(data as Record<string, unknown>)
    }

    const { data: fallback, error: fallbackError } = await supabase
      .from('profiles')
      .select(OWN_PROFILE_FALLBACK_COLUMNS)
      .eq('id', userId)
      .single()

    if (fallbackError) throw fallbackError
    return normalizeOwnProfile(fallback as Record<string, unknown>)
  },

  async getProfileByAlias(alias: string): Promise<PublicProfile | null> {
    const normalized = decodeURIComponent(alias).trim()
    if (!normalized) return null

    const { data, error } = await supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .ilike('alias', normalized)
      .maybeSingle()

    if (error) throw error
    return data as PublicProfile | null
  },

  async getMembersByCity(
    cityId: string,
    options?: { excludeUserId?: string; search?: string; limit?: number },
  ): Promise<PublicProfile[]> {
    let query = supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('alias')

    if (options?.excludeUserId) {
      query = query.neq('id', options.excludeUserId)
    }
    if (options?.search?.trim()) {
      query = query.ilike('alias', `%${options.search.trim()}%`)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as PublicProfile[]
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', userId)
      .select(OWN_PROFILE_COLUMNS)
      .single()

    if (error) throw error
    return data as Profile
  },

  async listProfiles(params?: {
    search?: string
    onlyPending?: boolean
    limit?: number
  }): Promise<AdminProfile[]> {
    let query = supabase
      .from('profiles')
      .select(ADMIN_PROFILE_COLUMNS)
      .order('created_at', { ascending: false })

    if (params?.onlyPending) {
      query = query.eq('account_status', 'pendiente')
    }

    if (params?.search?.trim()) {
      query = query.or(
        `alias.ilike.%${params.search}%,email.ilike.%${params.search}%`,
      )
    }
    if (params?.limit) query = query.limit(params.limit)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as AdminProfile[]
  },

  async adminUpdateProfile(
    userId: string,
    input: { role?: UserRole; is_active?: boolean },
  ): Promise<AdminProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', userId)
      .select(ADMIN_PROFILE_COLUMNS)
      .single()

    if (error) throw error
    return data as unknown as AdminProfile
  },

  async isEmailBlocked(email: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_email_blocked', { p_email: email })
    if (error) throw error
    return data as boolean
  },

  async createUserAsAdmin(input: CreateUserAsAdminInput): Promise<CreateUserAsAdminResult> {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: input,
    })
    if (error) throw error
    return data as CreateUserAsAdminResult
  },

  async reviewAccount(
    userId: string,
    reviewerId: string,
    input: ReviewAccountInput,
  ): Promise<AdminProfile> {
    const isActive = input.account_status === 'aprobada'

    const { data, error } = await supabase
      .from('profiles')
      .update({
        account_status: input.account_status,
        is_active: isActive,
        rejection_reason:
          input.account_status === 'rechazada' || input.account_status === 'bloqueada'
            ? input.rejection_reason ?? null
            : null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(ADMIN_PROFILE_COLUMNS)
      .single()

    if (error) throw error

    if (input.account_status === 'bloqueada') {
      const profile = data as unknown as AdminProfile
      const { error: blockError } = await supabase.from('blocked_emails').upsert(
        {
          email: profile.email.toLowerCase(),
          blocked_by: reviewerId,
          profile_id: userId,
          reason: input.rejection_reason ?? 'Cuenta bloqueada por administración',
        },
        { onConflict: 'email' },
      )
      if (blockError) throw blockError
    }

    return data as unknown as AdminProfile
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new Error('La imagen no puede superar 2 MB.')
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
  },
}
