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
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import { shareClienteAlertText } from '@/lib/share'
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
                {(isAuthor || isMod) && alert.status !== 'aprobada' && (
                  <AlertStatusBadge status={alert.status} />
                )}
              </div>
              <h1 className="mt-3 text-xl font-bold sm:text-2xl">{alert.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {(alert.city || alert.city_other) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {alert.city?.name ?? alert.city_other}
                  </span>
                )}
                <span>·</span>
                <span>{formatRelativeTime(alert.created_at)}</span>
                {alert.report_kind === 'recomendar' && <span>· Recomendación</span>}
                {alert.report_kind === 'funar' && <span>· Funa</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <BookmarkButton itemType="alert" itemId={alert.id} size="sm" />
              {!isAuthor && <ReportButton targetType="alert" targetId={alert.id} size="sm" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {alert.client_number && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              <strong>Número del cliente:</strong> {alert.client_number}
            </p>
          )}

          {alert.category === 'otro' && alert.category_other && (
            <p className="text-sm text-muted-foreground">
              Tipo indicado: {alert.category_other}
            </p>
          )}

          {alert.report_kind === 'recomendar' && (
            <div className="space-y-2 rounded-lg border p-3">
              {alert.rating != null && (
                <p className="text-sm">
                  <strong>Puntuación:</strong> {alert.rating}/5
                </p>
              )}
              {alert.treatment_notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Trato</p>
                  <p className="text-sm whitespace-pre-wrap">{alert.treatment_notes}</p>
                </div>
              )}
              {alert.hygiene_notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Higiene</p>
                  <p className="text-sm whitespace-pre-wrap">{alert.hygiene_notes}</p>
                </div>
              )}
            </div>
          )}

          {alert.report_kind !== 'recomendar' && (
            <p className="whitespace-pre-wrap leading-relaxed">{alert.description}</p>
          )}

          {alert.media && alert.media.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {alert.media
                  .filter((m) => m.kind === 'image' && m.url)
                  .map((m) => (
                    <img
                      key={m.id}
                      src={m.url}
                      alt=""
                      className="h-28 w-28 rounded-lg object-cover"
                    />
                  ))}
              </div>
              {alert.media
                .filter((m) => m.kind === 'video' && m.url)
                .map((m) => (
                  <video
                    key={m.id}
                    src={m.url}
                    controls
                    className="max-h-64 w-full rounded-lg border"
                  />
                ))}
            </div>
          )}

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
            </div>
          )}

          {(isAuthor || isMod || alert.status === 'aprobada') && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {alert.status === 'aprobada' && (
                <ShareWhatsAppButton
                  label="Compartir con alguna amiga"
                  text={shareClienteAlertText({
                    kind: alert.report_kind === 'recomendar' ? 'recomendar' : 'funar',
                    title: alert.title,
                    clientNumber: alert.client_number,
                    path: `/alerts/${alert.id}`,
                  })}
                />
              )}
              {(isAuthor || isMod) && (
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
