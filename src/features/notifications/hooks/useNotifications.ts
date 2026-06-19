import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { notificationService } from '@/services/notification.service'
import type { Notification } from '@/types/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getNotifications(user!.id),
    enabled: !!user?.id,
  })

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () => notificationService.getUnreadCount(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (notification: Notification) => {
        queryClient.setQueryData(['notifications', user.id], (old: Notification[] | undefined) => {
          if (!old) return [notification]
          if (old.some((n) => n.id === notification.id)) return old
          return [notification, ...old]
        })
        queryClient.setQueryData(['notifications-unread', user.id], (old: number | undefined) =>
          (old ?? 0) + 1,
        )
      },
    )

    return unsubscribe
  }, [user?.id, queryClient])

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id)
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread', user?.id] })
  }

  const markAllAsRead = async () => {
    if (!user?.id) return
    await notificationService.markAllAsRead(user.id)
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    queryClient.setQueryData(['notifications-unread', user.id], 0)
  }

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading,
    markAsRead,
    markAllAsRead,
    refetch: notificationsQuery.refetch,
  }
}
