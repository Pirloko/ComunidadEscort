import { Link } from 'react-router-dom'
import { MapPin, MessageCircle, Wifi, Users, ArrowRight, Bath } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HabitacionCardCover,
  HabitacionVideoPlayBadge,
} from '@/features/home/components/HabitacionCardCover'
import { isHabitacionVideoCover } from '@/features/home/lib/habitacion-cover'
import { getRecibeALabel, whatsappUrl, habitacionWhatsappPhone } from '@/lib/habitaciones'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import type { Resource } from '@/types/resources'

interface HabitacionCardProps {
  habitacion: Resource
  detailTo: string
  showFavorite?: boolean
}

export function HabitacionCard({ habitacion, detailTo, showFavorite = false }: HabitacionCardProps) {
  const whatsappPhone = habitacionWhatsappPhone(habitacion.whatsapp_phone)
  const recibeLabel = getRecibeALabel(
    habitacion.recibe_mujer,
    habitacion.recibe_hombre,
    habitacion.recibe_trans,
  )
  const videoCover = isHabitacionVideoCover(
    habitacion.photos,
    habitacion.video_url,
    habitacion.has_video_cover,
  )

  return (
    <article className="home-card-lift group overflow-hidden rounded-2xl border border-white/10 bg-card/90 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)]">
      <div className="relative">
        <Link to={detailTo} className="block overflow-hidden">
          <div className="relative aspect-[4/3] bg-muted">
            <HabitacionCardCover
              photos={habitacion.photos}
              videoUrl={habitacion.video_url}
              hasVideoCover={habitacion.has_video_cover}
              alt={habitacion.name}
              mediaClassName="transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            {videoCover && <HabitacionVideoPlayBadge />}
            {habitacion.city && (
              <span className="absolute bottom-3 left-3 z-[4] inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <MapPin className="h-3 w-3" />
                {habitacion.city.name}
              </span>
            )}
          </div>
        </Link>
        {showFavorite && (
          <div className="absolute right-2 top-2 z-[5]">
            <BookmarkButton
              itemType="resource"
              itemId={habitacion.id}
              size="sm"
              className="h-9 w-9 rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-black/70 hover:text-white"
            />
          </div>
        )}
      </div>

      <div className="space-y-3.5 p-4">
        <div className="space-y-2.5">
          <Link
            to={detailTo}
            className="home-display block text-[1.15rem] font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-primary"
          >
            {habitacion.name}
          </Link>

          <p className="habitacion-recibe-badge" title="Quiénes pueden hospedarse">
            <span className="habitacion-recibe-badge-label">Recibe a</span>
            <span className="habitacion-recibe-badge-value">{recibeLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {habitacion.tiene_wifi && (
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-muted/60 px-2 py-0.5 text-[10px] font-medium">
              <Wifi className="h-3 w-3" /> Wifi
            </span>
          )}
          {habitacion.tiene_bano_privado && (
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-muted/60 px-2 py-0.5 text-[10px] font-medium">
              <Bath className="h-3 w-3" /> Baño privado
            </span>
          )}
          {habitacion.acepta_parejas && (
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-muted/60 px-2 py-0.5 text-[10px] font-medium">
              <Users className="h-3 w-3" /> Parejas
            </span>
          )}
          {habitacion.pide_reserva && (
            <span className="rounded-md border border-white/10 bg-muted/60 px-2 py-0.5 text-[10px] font-medium">
              Pide reserva
            </span>
          )}
        </div>

        <div className="flex gap-2.5 pt-0.5">
          {whatsappPhone && (
            <Button
              asChild
              size="sm"
              className="habitacion-cta-primary h-11 flex-1 gap-2 rounded-xl px-3 text-[0.8125rem] font-semibold text-white"
            >
              <a
                href={whatsappUrl(
                  whatsappPhone,
                  `Hola, vi "${habitacion.name}" en Comunidadescort y quiero consultar arriendo.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="habitacion-cta-secondary h-11 flex-1 gap-1.5 rounded-xl border-white/15 px-3 text-[0.8125rem] font-semibold"
          >
            <Link to={detailTo}>
              Ver más
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
