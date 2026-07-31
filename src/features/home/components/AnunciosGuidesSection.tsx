import { Link } from 'react-router-dom'
import { ANUNCIOS_GUIDES, anunciosGuidePath } from '@/features/home/data/anuncios-guides'

/** Sección SEO en /home: guía de publicaciones en portales conocidos. */
export function AnunciosGuidesSection() {
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
    </section>
  )
}
