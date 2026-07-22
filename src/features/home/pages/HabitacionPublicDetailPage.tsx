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
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { HabitacionAttrsList } from '@/features/home/components/HabitacionAttrsList'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
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
      <div className="mx-auto max-w-lg space-y-4 p-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !habitacion) {
    return (
      <div className="mx-auto max-w-lg p-3">
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
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2 px-3">
          <BrandLogo size="md" to="/home" tone="dark" className="h-12 max-w-[min(100%,220px)]" />
          <Button asChild size="sm" variant="accent" className="shrink-0 gap-1 px-2.5">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-3 py-5">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <Card className="overflow-hidden">
          {photos.length > 0 && (
            <>
              <div className="aspect-[4/3] bg-muted">
                <img
                  src={currentPhoto}
                  alt={habitacion.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPhotoIdx(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === photoIdx ? 'border-accent' : 'border-transparent'
                      }`}
                    >
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <CardHeader className="space-y-2 pb-2">
            <h1 className="text-xl font-bold leading-snug">{habitacion.name}</h1>
            {habitacion.city && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {habitacion.city.name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {habitacion.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {habitacion.description}
              </p>
            )}

            {phone && (
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full gap-2 bg-emerald-700 hover:bg-emerald-600">
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
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={`tel:${phone}`}>
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>
                </Button>
              </div>
            )}

            <HabitacionAttrsList habitacion={habitacion} />

            {habitacion.house_rules && (
              <div className="space-y-2">
                <h2 className="font-semibold text-amber-500">
                  Observaciones o Reglas del Hospedaje
                </h2>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {habitacion.house_rules}
                </p>
              </div>
            )}

            <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
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
          </CardContent>
        </Card>

        <SafetyTipsSection />
      </main>
    </div>
  )
}
