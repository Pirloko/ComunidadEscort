import { Link } from 'react-router-dom'
import { MapPin, MessageCircle, Wifi, Users, ArrowRight, Bath } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { whatsappUrl, habitacionWhatsappPhone } from '@/lib/habitaciones'
import type { Resource } from '@/types/resources'

interface HabitacionCardProps {
  habitacion: Resource
  detailTo: string
}

export function HabitacionCard({ habitacion, detailTo }: HabitacionCardProps) {
  const photo = habitacion.photos?.[0]?.url
  const whatsappPhone = habitacionWhatsappPhone(habitacion.whatsapp_phone)

  return (
    <article className="home-card-lift group overflow-hidden rounded-2xl border border-white/8 bg-card/80">
      <Link to={detailTo} className="block overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted">
          {photo ? (
            <img
              src={photo}
              alt={habitacion.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin foto
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
          {habitacion.city && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3" />
              {habitacion.city.name}
            </span>
          )}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link
            to={detailTo}
            className="font-semibold text-foreground transition-colors hover:text-primary"
          >
            {habitacion.name}
          </Link>
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

        <div className="flex gap-2.5 pt-1">
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
