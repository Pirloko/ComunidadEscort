import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : 'Estás al día con todo'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Sin notificaciones"
            description="Te avisaremos cuando haya comentarios, mensajes o alertas."
          />
        )}

        <div className="divide-y">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))}
        </div>
      </div>
    </div>
  )
}
