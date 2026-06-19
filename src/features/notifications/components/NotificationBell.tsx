import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead } = useNotifications()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const recent = notifications.slice(0, 5)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notificaciones"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} sin leer</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            ) : (
              recent.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  compact
                />
              ))
            )}
          </div>

          <div className="border-t p-2">
            <Link
              to="/notifications"
              className={cn(
                'block rounded-lg py-2 text-center text-sm font-medium text-accent hover:bg-muted',
              )}
              onClick={() => setOpen(false)}
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
