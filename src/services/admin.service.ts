import { supabase } from '@/lib/supabase/client'
import type { AdminStats } from '@/types/admin'

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc('get_admin_stats')
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        moderators: 0,
        totalCities: 0,
        activeCities: 0,
        totalHabitaciones: 0,
        activeHabitaciones: 0,
        pendingAlerts: 0,
      }
    }

    return {
      totalUsers: Number(row.total_users ?? 0),
      activeUsers: Number(row.active_users ?? 0),
      pendingUsers: Number(row.pending_users ?? 0),
      moderators: Number(row.moderators ?? 0),
      totalCities: Number(row.total_cities ?? 0),
      activeCities: Number(row.active_cities ?? 0),
      totalHabitaciones: Number(row.total_habitaciones ?? 0),
      activeHabitaciones: Number(row.active_habitaciones ?? 0),
      pendingAlerts: Number(row.pending_alerts ?? 0),
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
