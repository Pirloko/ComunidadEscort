import { supabase } from '@/lib/supabase/client'
import type { AdminStats } from '@/types/admin'

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      moderators,
      totalCities,
      activeCities,
      totalHabitaciones,
      activeHabitaciones,
      pendingAlerts,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'pendiente'),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['moderator', 'admin']),
      supabase.from('cities').select('*', { count: 'exact', head: true }),
      supabase.from('cities').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'habitaciones_escort')
        .eq('status', 'aprobada'),
      supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'habitaciones_escort')
        .eq('status', 'aprobada')
        .eq('is_active', true),
      supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente'),
    ])

    const errors = [
      totalUsers.error,
      activeUsers.error,
      pendingUsers.error,
      moderators.error,
      totalCities.error,
      activeCities.error,
      totalHabitaciones.error,
      activeHabitaciones.error,
      pendingAlerts.error,
    ].filter(Boolean)

    if (errors.length) throw errors[0]

    return {
      totalUsers: totalUsers.count ?? 0,
      activeUsers: activeUsers.count ?? 0,
      pendingUsers: pendingUsers.count ?? 0,
      moderators: moderators.count ?? 0,
      totalCities: totalCities.count ?? 0,
      activeCities: activeCities.count ?? 0,
      totalHabitaciones: totalHabitaciones.count ?? 0,
      activeHabitaciones: activeHabitaciones.count ?? 0,
      pendingAlerts: pendingAlerts.count ?? 0,
    }
  },

  async getPendingUsersCount(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'pendiente')

    if (error) throw error
    return count ?? 0
  },
}
