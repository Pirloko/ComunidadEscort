import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import { NOTIFICATION_ICONS, getNotificationRoute, type Notification } from '@/types/notifications'

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ notification, onRead, compact }: NotificationItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id)
    navigate(getNotificationRoute(notification))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted',
        !notification.is_read && 'bg-accent/5',
        compact && 'py-2',
      )}
    >
      <span className="mt-0.5 text-lg">{NOTIFICATION_ICONS[notification.type] ?? '🔔'}</span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
      )}
    </button>
  )
}
