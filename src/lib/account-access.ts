import { profileService } from '@/services/profile.service'
import type { Profile } from '@/types/database'

/** Admin y moderadoras siempre pueden acceder. Usuarias normales: aprobada o is_active. */
export function canAccessCommunity(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'moderator') return true
  if (profile.account_status === 'bloqueada' || profile.account_status === 'rechazada') {
    return false
  }
  return profile.account_status === 'aprobada' || profile.is_active
}

export function isAccountPending(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'moderator') return false
  return !canAccessCommunity(profile)
}

export async function checkEmailBlocked(email: string): Promise<boolean> {
  return profileService.isEmailBlocked(email)
}
