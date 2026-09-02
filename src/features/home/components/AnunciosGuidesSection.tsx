import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { ANUNCIOS_GUIDES, anunciosGuidePath } from '@/features/home/data/anuncios-guides'
import { whatsappUrl } from '@/lib/habitaciones'
import { publisherService } from '@/services/publisher.service'
import type { RecommendedPublisher } from '@/types/admin'

function shufflePublishers(list: RecommendedPublisher[]): RecommendedPublisher[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j]!, next[i]!]
  }
  return next
}

/** Sección SEO en /home: guía de publicaciones en portales conocidos. */
export function AnunciosGuidesSection() {
  const { data: publishers = [] } = useQuery({
    queryKey: ['recommended-publishers'],
    queryFn: () => publisherService.listActive(),
    staleTime: 1000 * 60 * 5,
  })

  const shuffledPublishers = useMemo(
    () => shufflePublishers(publishers),
    [publishers],
  )

  return (
    <section className="space-y-4" aria-labelledby="guia-publicaciones-title">
      <div className="space-y-2.5">
        <h2
          id="guia-publicaciones-title"
          className="home-display home-section-title"
        >
          Guía de publicaciones
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aprende cómo funcionan las publicaciones y los avisos destacados en portales conocidos
          de Chile: planes TOP, subidas diarias, historias y diferencias de visibilidad en el
          listado.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cada guía explica en simple qué significa una publicación destacada, cómo se ve en el
          listado y qué opciones de promoción suelen ofrecer sitios como Chimbis, Skokka, Sexosur,
          Locanto, Escorcitas, Wenas y Gemidos — útil si publicas o quieres entender mejor el
          mercado de avisos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ANUNCIOS_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            to={anunciosGuidePath(guide)}
            className="inline-flex h-9 items-center rounded-full border border-white/10 bg-card/80 px-3.5 text-sm font-medium text-foreground transition hover:border-accent/45 hover:bg-accent/10"
          >
            {guide.name}
          </Link>
        ))}
      </div>

      {shuffledPublishers.length > 0 && (
        <div className="space-y-3 border-t border-white/8 pt-4" aria-labelledby="publicadores-title">
          <div className="space-y-1">
            <h3
              id="publicadores-title"
              className="home-display home-section-title !text-[clamp(1.25rem,4.5vw,1.55rem)]"
            >
              Publicadores recomendados
            </h3>
            <p className="text-xs text-muted-foreground">Contacto directo por WhatsApp.</p>
          </div>

          <ul className="space-y-2">
            {shuffledPublishers.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/70 px-3 py-2.5"
              >
                <Avatar
                  src={p.logo_url}
                  alias={p.name}
                  size="md"
                  className="h-11 w-11 shrink-0 border border-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                  {p.note && (
                    <p className="truncate text-xs text-muted-foreground">{p.note}</p>
                  )}
                </div>
                <Button
                  asChild
                  size="sm"
                  className="habitacion-cta-primary h-11 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-semibold text-white"
                >
                  <a
                    href={whatsappUrl(
                      p.whatsapp,
                      `Hola ${p.name}, te contacto desde Comunidadescort.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
