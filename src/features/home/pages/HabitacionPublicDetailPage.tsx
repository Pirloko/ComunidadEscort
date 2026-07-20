import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Map,
  Globe,
  ExternalLink,
  Shield,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { HabitacionAttrsList } from '@/features/home/components/HabitacionAttrsList'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
import { APP_NAME } from '@/lib/constants'
import {
  primaryContactPhone,
  whatsappUrl,
} from '@/lib/habitaciones'
import { resourceService } from '@/services/resource.service'

export function HabitacionPublicDetailPage() {
  const { habitacionId } = useParams<{ habitacionId: string }>()
  const [photoIdx, setPhotoIdx] = useState(0)

  const { data: habitacion, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-habitacion', habitacionId],
    queryFn: () => resourceService.getPublicHabitacionById(habitacionId!),
    enabled: !!habitacionId,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !habitacion) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <ErrorState title="Habitación no encontrada" onRetry={() => refetch()} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/home">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  const photos = habitacion.photos ?? []
  const currentPhoto = photos[photoIdx]?.url
  const phone = primaryContactPhone(
    habitacion.whatsapp_phone,
    habitacion.contact_phone,
    habitacion.phone,
  )
  const mapsUrl =
    habitacion.google_maps_url ||
    (habitacion.latitude && habitacion.longitude
      ? `https://www.google.com/maps?q=${habitacion.latitude},${habitacion.longitude}`
      : null)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link to="/home" className="flex items-center gap-2 text-primary">
            <Shield className="h-6 w-6 text-accent" />
            <span className="font-bold">{APP_NAME}</span>
          </Link>
          <Button asChild size="sm" variant="accent" className="gap-1">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a habitaciones
        </Link>

        <Card className="overflow-hidden">
          <div className="aspect-video bg-muted">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={habitacion.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sin fotos
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                    i === photoIdx ? 'border-accent' : 'border-transparent'
                  }`}
                >
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <CardHeader className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Habitaciones para escort
            </p>
            <h1 className="text-2xl font-bold">{habitacion.name}</h1>
            {habitacion.city && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {habitacion.city.name}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {habitacion.description && (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {habitacion.description}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {phone && (
                <>
                  <Button asChild className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <a
                      href={whatsappUrl(
                        phone,
                        `Hola, vi "${habitacion.name}" en Comunidadescort y quiero consultar arriendo.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 gap-2">
                    <a href={`tel:${phone}`}>
                      <Phone className="h-4 w-4" />
                      Llamar
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div>
              <h2 className="mb-2 font-semibold">Condiciones</h2>
              <HabitacionAttrsList habitacion={habitacion} />
            </div>

            {(habitacion.address || mapsUrl || habitacion.website) && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                {habitacion.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {habitacion.address}
                  </p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <Map className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                )}
                {habitacion.website && (
                  <a
                    href={habitacion.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Sitio web
                  </a>
                )}
                {habitacion.instagram_url && (
                  <a
                    href={habitacion.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {habitacion.facebook_url && (
                  <a
                    href={habitacion.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Facebook
                  </a>
                )}
              </div>
            )}

            {habitacion.house_rules && (
              <div className="space-y-2">
                <h2 className="font-semibold text-amber-500 underline decoration-amber-500/50">
                  Observaciones o Reglas del Hospedaje
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {habitacion.house_rules}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <SafetyTipsSection />
      </main>
    </div>
  )
}
