import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  MessageCircle,
  Map,
  Pencil,
  Trash2,
  BadgeCheck,
} from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ResourceCategoryBadge } from '@/features/resources/components/ResourceCategoryBadge'
import { ResourceCommentThread } from '@/features/resources/components/ResourceCommentThread'
import { ResourceReviewSection } from '@/features/resources/components/ResourceReviewSection'
import { HabitacionAttrsList } from '@/features/home/components/HabitacionAttrsList'
import { HabitacionMediaGallery } from '@/features/home/components/HabitacionMediaGallery'
import { AlertStatusBadge } from '@/features/alerts/components/AlertStatusBadge'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { StarRating } from '@/components/shared/StarRating'
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import { shareCasaPageText } from '@/lib/share'
import { HABITACION_CONTACT_NOTICE, habitacionCallPhone, habitacionWhatsappPhone, whatsappUrl } from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'
import { resourceCommentService } from '@/services/resource-comment.service'
import { resourceReviewService } from '@/services/resource-review.service'
import '@/features/home/home-landing.css'

export function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const fromCasas = location.pathname.startsWith('/casas')

  const { data: resource, isLoading, isError, refetch } = useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => resourceService.getResourceById(resourceId!),
    enabled: !!resourceId,
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['resource-comments', resourceId],
    queryFn: () => resourceCommentService.getCommentsByResource(resourceId!),
    enabled: !!resourceId,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['resource-reviews', resourceId],
    queryFn: () => resourceReviewService.getReviewsByResource(resourceId!),
    enabled: !!resourceId,
  })

  const isAuthor = user?.id === resource?.author_id
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'
  const isHabitacion = resource?.category === 'habitaciones_escort'
  const canEdit = isHabitacion ? isAdmin : isMod
  const canDelete = isHabitacion ? isAdmin : isAuthor || isMod
  const canView =
    (resource?.status === 'aprobada' && resource?.is_active) || isAuthor || isMod

  const mapsUrl =
    resource?.google_maps_url ||
    (resource?.latitude && resource?.longitude
      ? `https://www.google.com/maps?q=${resource.latitude},${resource.longitude}`
      : null)

  const whatsappPhone = resource
    ? habitacionWhatsappPhone(resource.whatsapp_phone)
    : null
  const callPhone = resource
    ? habitacionCallPhone(resource.contact_phone, resource.phone)
    : null

  const handleDelete = async () => {
    if (!resource || !confirm('¿Eliminar este dato?')) return
    await resourceService.deleteResource(resource.id)
    navigate('/resources')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !resource || !canView) {
    return <ErrorState title="Dato no encontrado" onRetry={() => refetch()} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={fromCasas ? '/casas' : '/resources'}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {fromCasas ? 'Volver a Casas y habitaciones' : 'Volver a Datos de todo'}
      </Link>

      <Card className="overflow-hidden">
        {isHabitacion && (
          <HabitacionMediaGallery
            key={`${resource.id}-${resource.photos?.length ?? 0}-${resource.video_url ?? ''}`}
            photos={resource.photos}
            videoUrl={resource.video_url}
            alt={resource.name}
          />
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ResourceCategoryBadge category={resource.category} />
                {(isAuthor || isMod) && <AlertStatusBadge status={resource.status} />}
                {isHabitacion && resource.is_public && (
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                    Visible en /home
                  </span>
                )}
                {resource.status === 'aprobada' && resource.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verificado por la comunidad
                  </span>
                )}
              </div>
              <h1 className="page-title mt-3">{resource.name}</h1>
              {resource.reviews_count > 0 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <StarRating value={resource.rating_avg ?? 0} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {resource.rating_avg} ({resource.reviews_count} reseña
                    {resource.reviews_count !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {resource.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {resource.city.name}
                  </span>
                )}
                <span>·</span>
                <span>Agregado {formatRelativeTime(resource.created_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {isHabitacion && (
                <ShareWhatsAppButton
                  size="sm"
                  variant="ghost"
                  label="Compartir con alguna amiga"
                  className="h-8 px-2 text-[11px]"
                  text={shareCasaPageText({
                    houseName: resource.name,
                    path: fromCasas ? `/casas/${resource.id}` : `/resources/${resource.id}`,
                  })}
                />
              )}
              <BookmarkButton itemType="resource" itemId={resource.id} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resource.description && (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {resource.description}
            </p>
          )}

          {resource.status === 'pendiente' && isAuthor && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              Este dato está <strong>pendiente de revisión</strong>. Te notificaremos cuando sea
              aprobado o rechazado.
            </div>
          )}

          {resource.status === 'rechazada' && isAuthor && resource.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/30">
              <strong>Motivo del rechazo:</strong> {resource.rejection_reason}
            </div>
          )}

          {resource.status === 'aprobada' && (
            <>
              {isHabitacion && (
                <p className="rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
                  {HABITACION_CONTACT_NOTICE}
                </p>
              )}

              {isHabitacion && (whatsappPhone || callPhone) && (
                <div
                  className={`grid gap-3 ${
                    whatsappPhone && callPhone ? 'sm:grid-cols-2' : ''
                  }`}
                >
                  {whatsappPhone && (
                    <Button
                      asChild
                      className="habitacion-cta-primary h-12 gap-2.5 rounded-xl text-base font-semibold text-white"
                    >
                      <a
                        href={whatsappUrl(
                          whatsappPhone,
                          `Hola, vi "${resource.name}" en Comunidadescort y quiero consultar arriendo.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="habitacion-cta-icon habitacion-cta-icon-wa">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {callPhone && (
                    <Button
                      asChild
                      variant="outline"
                      className="habitacion-cta-call h-12 gap-2.5 rounded-xl text-base font-semibold"
                    >
                      <a href={`tel:${callPhone}`}>
                        <span className="habitacion-cta-icon habitacion-cta-icon-call">
                          <Phone className="h-4 w-4" />
                        </span>
                        Llamar
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {isHabitacion && <HabitacionAttrsList habitacion={resource} />}

              {isHabitacion && resource.house_rules && (
                <div className="space-y-2">
                  <h2 className="font-semibold text-amber-500">
                    Observaciones o Reglas del Hospedaje
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {resource.house_rules}
                  </p>
                </div>
              )}

              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                {!isHabitacion && resource.phone && (
                  <a
                    href={`tel:${resource.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-accent"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {resource.phone}
                  </a>
                )}
                {!isHabitacion && resource.whatsapp_phone && (
                  <a
                    href={`https://wa.me/${resource.whatsapp_phone.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-accent"
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    WhatsApp: {resource.whatsapp_phone}
                  </a>
                )}
                {resource.address && (
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {resource.address}
                  </p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <Map className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                )}
                {resource.website && (
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {resource.website}
                  </a>
                )}
                {resource.instagram_url && (
                  <a
                    href={resource.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {resource.facebook_url && (
                  <a
                    href={resource.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Facebook
                  </a>
                )}
              </div>
            </>
          )}

          {resource.author && resource.status === 'aprobada' && (
            <p className="text-sm text-muted-foreground">
              Publicado por @{resource.author.alias}
            </p>
          )}

          {(canEdit || canDelete) && (
            <div className="flex gap-2 border-t pt-4">
              {canEdit && (
                <Link to={`/resources/${resource.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="section-title">Reseñas</h2>
          <p className="text-xs text-muted-foreground">
            Solo visibles para miembros con sesión iniciada.
          </p>
        </CardHeader>
        <CardContent>
          <ResourceReviewSection
            resourceId={resource.id}
            resourceName={resource.name}
            reviews={user ? reviews : []}
            enriched={isHabitacion}
            sharePath={fromCasas ? `/casas/${resource.id}` : `/resources/${resource.id}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="section-title">Comentarios</h2>
        </CardHeader>
        <CardContent>
          <ResourceCommentThread resourceId={resource.id} comments={comments} />
        </CardContent>
      </Card>
    </div>
  )
}
