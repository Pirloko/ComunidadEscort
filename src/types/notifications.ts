import type { NotificationType } from '@/types/database'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, string>
  is_read: boolean
  created_at: string
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  new_comment: '💬',
  new_reply: '↩️',
  alert_approved: '✅',
  alert_rejected: '❌',
  resource_approved: '✅',
  resource_rejected: '❌',
  account_approved: '✅',
  account_rejected: '❌',
  new_message: '✉️',
  mention: '@',
}

export function getNotificationRoute(notification: Notification): string {
  const { type } = notification
  const data = notification.data ?? {}
  switch (type) {
    case 'new_comment':
    case 'new_reply':
      return data.post_id ? `/forum/${data.post_id}` : '/forum'
    case 'alert_approved':
    case 'alert_rejected':
      return data.alert_id ? `/alerts/${data.alert_id}` : '/alerts/mine'
    case 'resource_approved':
    case 'resource_rejected':
      return data.resource_id ? `/resources/${data.resource_id}` : '/resources/mine'
    case 'account_approved':
      return '/feed'
    case 'account_rejected':
      return '/cuenta-pendiente'
    case 'new_message':
      return '/chat'
    case 'mention':
      return data.post_id ? `/forum/${data.post_id}` : '/forum'
    default:
      return '/notifications'
  }
}
