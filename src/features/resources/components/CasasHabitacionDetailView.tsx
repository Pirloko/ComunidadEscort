import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Map,
  Globe,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/shared/StarRating'
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { HabitacionAttrsList } from '@/features/home/components/HabitacionAttrsList'
import { HabitacionMediaGallery } from '@/features/home/components/HabitacionMediaGallery'
import { ResourceCommentThread } from '@/features/resources/components/ResourceCommentThread'
import { ResourceReviewSection } from '@/features/resources/components/ResourceReviewSection'
import { shareCasaPageText } from '@/lib/share'
import {
  HABITACION_CONTACT_NOTICE,
  habitacionCallPhone,
  habitacionWhatsappPhone,
  whatsappUrl,
} from '@/lib/habitaciones'
import type { ResourceComment } from '@/types/resource-comments'
import type { ResourceReview } from '@/types/resource-reviews'
import type { Resource } from '@/types/resources'

interface CasasHabitacionDetailViewProps {
  resource: Resource
  reviews: ResourceReview[]
  comments: ResourceComment[]
  userId?: string
  sharePath: string
}

export function CasasHabitacionDetailView({
  resource,
  reviews,
  comments,
  userId,
  sharePath,
}: CasasHabitacionDetailViewProps) {
  const whatsappPhone = habitacionWhatsappPhone(resource.whatsapp_phone)
  const callPhone = habitacionCallPhone(resource.contact_phone, resource.phone)
  const mapsUrl =
    resource.google_maps_url ||
    (resource.latitude && resource.longitude
      ? `https://www.google.com/maps?q=${resource.latitude},${resource.longitude}`
      : null)

  const hasLinks =
    resource.address ||
    mapsUrl ||
    resource.website ||
    resource.instagram_url ||
    resource.facebook_url

  return (
    <div className="habitacion-community-detail -mx-3 sm:mx-0">
      <Link to="/casas" className="habitacion-back-link mb-4 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Volver a casas
      </Link>

      <Card className="habitacion-detail-card overflow-hidden border-0 shadow-none">
        <HabitacionMediaGallery
          key={`${resource.id}-${resource.photos?.length ?? 0}-${resource.video_url ?? ''}`}
          photos={resource.photos}
          videoUrl={resource.video_url}
          alt={resource.name}
        />

        <CardContent className="space-y-5 p-4 pt-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="habitacion-section-label">Casa / habitación</p>
              <h1 className="home-display text-[clamp(1.35rem,5vw,1.75rem)] font-semibold leading-tight">
                {resource.name}
              </h1>
              {resource.city && (
                <span className="habitacion-city-pill">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {resource.city.name}
                </span>
              )}
              {resource.reviews_count > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <StarRating value={resource.rating_avg ?? 0} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {resource.rating_avg} ({resource.reviews_count})
                  </span>
                </div>
              )}
              {resource.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verificada
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <BookmarkButton
                itemType="resource"
                itemId={resource.id}
                size="sm"
                showLabel
                savedLabel="En favoritas"
                unsavedLabel="Favorita"
                className="habitacion-fav-btn"
              />
              <ShareWhatsAppButton
                size="sm"
                variant="ghost"
                label="Compartir"
                className="h-8 px-2 text-[11px]"
                text={shareCasaPageText({ houseName: resource.name, path: sharePath })}
              />
            </div>
          </div>

          {resource.description && (
            <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/90">
              {resource.description}
            </p>
          )}

          <p className="rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-3 text-sm leading-relaxed">
            {HABITACION_CONTACT_NOTICE}
          </p>

          {(whatsappPhone || callPhone) && (
            <div
              className={`grid gap-3 sm:grid-cols-2 ${
                whatsappPhone && callPhone ? '' : 'max-w-md'
              }`}
            >
              {whatsappPhone && (
                <Button
                  asChild
                  size="lg"
                  className="habitacion-cta-primary h-13 min-h-14 w-full gap-3 rounded-2xl text-base font-semibold text-white"
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
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    WhatsApp
                  </a>
                </Button>
              )}
              {callPhone && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="habitacion-cta-call h-13 min-h-14 w-full gap-3 rounded-2xl text-base font-semibold"
                >
                  <a href={`tel:${callPhone}`}>
                    <span className="habitacion-cta-icon habitacion-cta-icon-call">
                      <Phone className="h-5 w-5" />
                    </span>
                    Llamar
                  </a>
                </Button>
              )}
            </div>
          )}

          <HabitacionAttrsList habitacion={resource} />

          {resource.house_rules && (
            <div className="habitacion-rules-panel space-y-2 rounded-2xl p-4">
              <h2 className="home-display text-lg font-semibold text-amber-400">
                Reglas del hospedaje
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {resource.house_rules}
              </p>
            </div>
          )}

          {hasLinks && (
            <div className="habitacion-links-panel space-y-2 rounded-2xl p-3">
              <p className="habitacion-section-label px-1 pb-1">Ubicación y contacto</p>
              {resource.address && (
                <div className="flex items-start gap-3 rounded-xl px-2 py-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{resource.address}</span>
                </div>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="habitacion-link-pill"
                >
                  <span className="habitacion-link-pill-icon">
                    <Map className="h-4 w-4" />
                  </span>
                  Ver en Google Maps
                </a>
              )}
              {resource.website && (
                <a
                  href={resource.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="habitacion-link-pill"
                >
                  <span className="habitacion-link-pill-icon">
                    <Globe className="h-4 w-4" />
                  </span>
                  Sitio web
                </a>
              )}
              {resource.instagram_url && (
                <a
                  href={resource.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="habitacion-link-pill"
                >
                  <span className="habitacion-link-pill-icon">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  Instagram
                </a>
              )}
              {resource.facebook_url && (
                <a
                  href={resource.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="habitacion-link-pill"
                >
                  <span className="habitacion-link-pill-icon">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  Facebook
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6 pb-4">
        <Card className="habitacion-detail-card border-0">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div>
              <h2 className="section-title">Reseñas</h2>
              <p className="text-xs text-muted-foreground">Solo para miembros con sesión.</p>
            </div>
            <ResourceReviewSection
              resourceId={resource.id}
              resourceName={resource.name}
              reviews={userId ? reviews : []}
              enriched
              sharePath={sharePath}
            />
          </CardContent>
        </Card>

        <Card className="habitacion-detail-card border-0">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <h2 className="section-title">Comentarios</h2>
            <ResourceCommentThread resourceId={resource.id} comments={comments} />
          </CardContent>
        </Card>
      </div>

      {(whatsappPhone || userId) && (
        <div className="habitacion-sticky-actions lg:hidden" aria-hidden={false}>
          {userId && (
            <BookmarkButton
              itemType="resource"
              itemId={resource.id}
              showLabel
              savedLabel="Guardada"
              unsavedLabel="Favorita"
              className="habitacion-sticky-fav"
            />
          )}
          {whatsappPhone && (
            <Button
              asChild
              className="habitacion-cta-primary h-12 flex-1 gap-2 rounded-xl font-semibold text-white"
            >
              <a
                href={whatsappUrl(
                  whatsappPhone,
                  `Hola, vi "${resource.name}" en Comunidadescort y quiero consultar arriendo.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
