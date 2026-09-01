import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, Mail, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import { contactService } from '@/services/contact.service'
import type { ContactMessage } from '@/types/contact'
import { cn } from '@/lib/utils'

function ContactMessageRow({
  message,
  selected,
  onSelect,
}: {
  message: ContactMessage
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition last:border-b-0 hover:bg-muted/40',
        selected && 'bg-muted/50',
        !message.is_read && 'border-l-2 border-l-primary bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('font-medium', !message.is_read && 'text-foreground')}>
          {message.subject}
        </span>
        {!message.is_read && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            Nuevo
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {message.name} · {message.email}
      </p>
      <p className="line-clamp-1 text-xs text-muted-foreground">{message.message}</p>
      <p className="text-[11px] text-muted-foreground/80">
        {formatRelativeTime(message.created_at)}
      </p>
    </button>
  )
}

export function AdminContactMessagesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: () => contactService.listAll(),
    refetchInterval: 30000,
  })

  const selected = messages.find((m) => m.id === selectedId) ?? null

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
    queryClient.invalidateQueries({ queryKey: ['admin-contact-unread-count'] })
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => contactService.markAsRead(id, user!.id),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactService.delete(id),
    onSuccess: () => {
      if (selectedId) setSelectedId(null)
      invalidate()
    },
  })

  const handleSelect = (message: ContactMessage) => {
    setSelectedId(message.id)
    if (!message.is_read && user) {
      markReadMutation.mutate(message.id)
    }
  }

  const handleDelete = () => {
    if (!selected) return
    if (!window.confirm(`¿Eliminar el mensaje de «${selected.name}»?`)) return
    deleteMutation.mutate(selected.id)
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" />
            Mensajes de contacto ({messages.length})
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{unreadCount} nuevos</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <EmptyState
              icon={Mail}
              title="Sin mensajes"
              description="Los mensajes del formulario Contáctanos del home aparecerán aquí."
            />
          )}

          {messages.map((message) => (
            <ContactMessageRow
              key={message.id}
              message={message}
              selected={selectedId === message.id}
              onSelect={() => handleSelect(message)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle</CardTitle>
          {selected && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Selecciona un mensaje para leerlo completo.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{selected.subject}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatRelativeTime(selected.created_at)}
                  {selected.is_read ? ' · Leído' : ' · Sin leer'}
                </p>
              </div>

              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{selected.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                      {selected.email}
                    </a>
                  </dd>
                </div>
                {selected.phone && (
                  <div>
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd>
                      <a href={`tel:${selected.phone}`} className="text-primary hover:underline">
                        {selected.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mensaje
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
