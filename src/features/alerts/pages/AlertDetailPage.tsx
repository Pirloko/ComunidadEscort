import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { AlertStatusBadge } from '@/features/alerts/components/AlertStatusBadge'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { ReportButton } from '@/features/reports/components/ReportButton'
import { StartChatButton } from '@/features/chat/components/StartChatButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import { alertService } from '@/services/alert.service'
import { useNavigate } from 'react-router-dom'

export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const { data: alert, isLoading, isError, refetch } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => alertService.getAlertById(alertId!),
    enabled: !!alertId,
  })

  const isAuthor = user?.id === alert?.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'
  const canMessageAuthor =
    alert?.author &&
    user?.id !== alert.author_id &&
    alert.author_id &&
    alert.status === 'aprobada'

  const handleDelete = async () => {
    if (!alert || !confirm('¿Eliminar esta alerta?')) return
    await alertService.deleteAlert(alert.id)
    navigate('/alerts')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !alert) {
    return <ErrorState title="Alerta no encontrada" onRetry={() => refetch()} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/alerts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a alertas
      </Link>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <AlertCategoryBadge category={alert.category} />
                {(isAuthor || isMod) && <AlertStatusBadge status={alert.status} />}
              </div>
              <h1 className="mt-3 text-xl font-bold sm:text-2xl">{alert.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {alert.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {alert.city.name}
                  </span>
                )}
                <span>·</span>
                <span>{formatRelativeTime(alert.created_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0">
              <BookmarkButton itemType="alert" itemId={alert.id} size="sm" />
              {!isAuthor && <ReportButton targetType="alert" targetId={alert.id} size="sm" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap leading-relaxed">{alert.description}</p>

          {alert.location_detail && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              📍 <strong>Zona:</strong> {alert.location_detail}
            </p>
          )}

          {alert.status === 'pendiente' && isAuthor && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              Tu alerta está <strong>pendiente de revisión</strong>. Te notificaremos cuando sea aprobada o rechazada.
            </div>
          )}

          {alert.status === 'rechazada' && isAuthor && alert.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/30">
              <strong>Motivo del rechazo:</strong> {alert.rejection_reason}
            </div>
          )}

          {alert.status === 'aprobada' && alert.author && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to={`/profile/${alert.author.alias}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <Avatar src={alert.author.avatar_url} alias={alert.author.alias} size="sm" />
                <span className="text-sm text-muted-foreground">
                  Reportada por{' '}
                  <span className="font-medium text-foreground">@{alert.author.alias}</span>
                </span>
              </Link>
              {canMessageAuthor && (
                <StartChatButton
                  otherUserId={alert.author_id}
                  otherAlias={alert.author.alias}
                  size="sm"
                  compact
                />
              )}
            </div>
          )}

          {(isAuthor || isMod) && (
            <div className="flex gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
