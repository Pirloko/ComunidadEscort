import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Map,
  Globe,
  ExternalLink,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { HabitacionAttrsList } from '@/features/home/components/HabitacionAttrsList'
import { HabitacionMediaGallery } from '@/features/home/components/HabitacionMediaGallery'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
import {
  HABITACION_CONTACT_NOTICE,
  habitacionCallPhone,
  habitacionWhatsappPhone,
  whatsappUrl,
} from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'
import '@/features/home/home-landing.css'

export function HabitacionPublicDetailPage() {
  const { habitacionId } = useParams<{ habitacionId: string }>()

  const { data: habitacion, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-habitacion', habitacionId],
    queryFn: () => resourceService.getPublicHabitacionById(habitacionId!),
    enabled: !!habitacionId,
  })

  if (isLoading) {
    return (
      <div className="home-landing home-landing-bg habitacion-detail-shell min-h-dvh">
        <div className="home-landing-mesh absolute inset-x-0 top-0 h-[320px]" aria-hidden />
        <div className="relative mx-auto max-w-lg space-y-4 p-4 pt-6">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !habitacion) {
    return (
      <div className="home-landing home-landing-bg habitacion-detail-shell min-h-dvh p-4">
        <div className="mx-auto max-w-lg pt-8">
          <ErrorState title="Habitación no encontrada" onRetry={() => refetch()} />
          <div className="mt-4 text-center">
            <Button asChild variant="outline">
              <Link to="/home">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const whatsappPhone = habitacionWhatsappPhone(habitacion.whatsapp_phone)
  const callPhone = habitacionCallPhone(habitacion.contact_phone, habitacion.phone)
  const mapsUrl =
    habitacion.google_maps_url ||
    (habitacion.latitude && habitacion.longitude
      ? `https://www.google.com/maps?q=${habitacion.latitude},${habitacion.longitude}`
      : null)

  const hasLinks =
    habitacion.address ||
    mapsUrl ||
    habitacion.website ||
    habitacion.instagram_url ||
    habitacion.facebook_url

  return (
    <div className="home-landing home-landing-bg habitacion-detail-shell min-h-dvh">
      <div className="home-landing-mesh pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:h-16 sm:px-4">
          <BrandLogo size="md" to="/home" tone="dark" className="h-10 max-w-[min(100%,180px)] sm:h-12 sm:max-w-[min(100%,220px)]" />
          <Button
            asChild
            size="sm"
            variant="accent"
            className="home-btn-enter h-9 shrink-0 gap-1.5 rounded-full px-3.5 font-semibold"
          >
            <Link to="/login">
              <LogIn className="h-4 w-4 shrink-0" />
              Entrar
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg space-y-6 px-4 py-5 pb-10">
        <Link to="/home" className="habitacion-back-link home-fade-up">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <Card className="habitacion-detail-card home-fade-up home-fade-up-delay-1 overflow-hidden border-0 bg-transparent shadow-none">
          <HabitacionMediaGallery
            key={`${habitacion.id}-${habitacion.photos?.length ?? 0}-${habitacion.video_url ?? ''}`}
            photos={habitacion.photos}
            videoUrl={habitacion.video_url}
            alt={habitacion.name}
          />

          <CardContent className="space-y-6 p-5 pt-6 sm:p-6">
            <div className="home-fade-up home-fade-up-delay-2 space-y-3">
              <p className="habitacion-section-label">Habitación para escort</p>
              <h1 className="home-display text-display text-[clamp(1.35rem,1.15rem+1.2vw,1.85rem)] font-semibold leading-tight text-foreground">
                {habitacion.name}
              </h1>
              {habitacion.city && (
                <span className="habitacion-city-pill">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {habitacion.city.name}
                </span>
              )}
            </div>

            {habitacion.description && (
              <p className="home-fade-up home-fade-up-delay-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/85">
                {habitacion.description}
              </p>
            )}

            <p className="home-fade-up home-fade-up-delay-3 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
              {HABITACION_CONTACT_NOTICE}
            </p>

            {(whatsappPhone || callPhone) && (
              <div
                className={`home-fade-up home-fade-up-delay-3 grid gap-3 ${
                  whatsappPhone && callPhone ? 'sm:grid-cols-2' : ''
                }`}
              >
                {whatsappPhone && (
                  <Button
                    asChild
                    size="lg"
                    className={`habitacion-cta-primary h-13 min-h-14 w-full gap-3 rounded-2xl px-5 text-[1.05rem] font-semibold text-white ${
                      !callPhone ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <a
                      href={whatsappUrl(
                        whatsappPhone,
                        `Hola, vi "${habitacion.name}" en Comunidadescort y quiero consultar arriendo.`,
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
                    className={`habitacion-cta-call h-13 min-h-14 w-full gap-3 rounded-2xl px-5 text-[1.05rem] font-semibold ${
                      !whatsappPhone ? 'sm:col-span-2' : ''
                    }`}
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

            <div className="home-fade-up home-fade-up-delay-4">
              <HabitacionAttrsList habitacion={habitacion} />
            </div>

            {habitacion.house_rules && (
              <div className="habitacion-rules-panel home-fade-up home-fade-up-delay-4 space-y-3 rounded-2xl p-4">
                <h2 className="home-display text-lg font-semibold text-amber-400">
                  Observaciones o reglas del hospedaje
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {habitacion.house_rules}
                </p>
              </div>
            )}

            {hasLinks && (
              <div className="habitacion-links-panel home-fade-up home-fade-up-delay-4 space-y-2 rounded-2xl p-3">
                <p className="habitacion-section-label px-1 pb-1">Ubicación y contacto</p>

                {habitacion.address && (
                  <div className="flex items-start gap-3 rounded-xl px-2 py-2 text-sm text-foreground/90">
                    <span className="habitacion-link-pill-icon mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="leading-relaxed">{habitacion.address}</span>
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

                {habitacion.website && (
                  <a
                    href={habitacion.website}
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

                {habitacion.instagram_url && (
                  <a
                    href={habitacion.instagram_url}
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

                {habitacion.facebook_url && (
                  <a
                    href={habitacion.facebook_url}
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

        <div className="home-fade-up home-fade-up-delay-4">
          <SafetyTipsSection />
        </div>
      </main>
    </div>
  )
}
