import { Link } from 'react-router-dom'
import { MapPin, MessageCircle, Wifi, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { whatsappUrl, primaryContactPhone } from '@/lib/habitaciones'
import type { Resource } from '@/types/resources'

interface HabitacionCardProps {
  habitacion: Resource
  detailTo: string
}

export function HabitacionCard({ habitacion, detailTo }: HabitacionCardProps) {
  const photo = habitacion.photos?.[0]?.url
  const phone = primaryContactPhone(
    habitacion.whatsapp_phone,
    habitacion.contact_phone,
    habitacion.phone,
  )

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Link to={detailTo} className="block">
        <div className="aspect-[4/3] bg-muted">
          {photo ? (
            <img
              src={photo}
              alt={habitacion.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin foto
            </div>
          )}
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <div>
          <Link to={detailTo} className="font-semibold hover:text-accent">
            {habitacion.name}
          </Link>
          {habitacion.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {habitacion.city.name}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {habitacion.tiene_wifi && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              <Wifi className="h-3 w-3" /> Wifi
            </span>
          )}
          {habitacion.acepta_parejas && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              <Users className="h-3 w-3" /> Parejas
            </span>
          )}
          {habitacion.pide_reserva && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              Pide reserva
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {phone && (
            <Button asChild size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700">
              <a
                href={whatsappUrl(phone, `Hola, vi "${habitacion.name}" en Comunidadescort y quiero consultar arriendo.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={detailTo}>Ver más</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
