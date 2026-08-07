import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import {
  ANUNCIOS_GUIDES,
  anunciosGuidePath,
  getAnunciosGuideByPath,
} from '@/features/home/data/anuncios-guides'
import { setDocumentMeta } from '@/lib/seo-habitaciones'
import '@/features/home/home-landing.css'

export function AnunciosGuidePage() {
  const { pathname } = useLocation()
  const pathSegment = pathname.replace(/^\//, '').split('/')[0] ?? ''
  const guide = getAnunciosGuideByPath(pathSegment)

  useEffect(() => {
    if (!guide) return
    setDocumentMeta({
      title: `${guide.title} | Comunidadescort`,
      description: guide.description,
    })
  }, [guide])

  if (!guide) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="home-landing home-landing-bg relative min-h-dvh overflow-x-hidden">
      <div className="home-landing-mesh absolute inset-x-0 top-0 h-[320px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:h-[4.5rem]">
          <BrandLogo
            size="lg"
            to="/home"
            tone="dark"
            className="h-12 max-w-[min(100%,240px)] sm:h-14 sm:max-w-[min(100%,280px)]"
          />
          <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3.5">
            <Link to="/home">Inicio</Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg space-y-7 px-3 pb-[max(3rem,env(safe-area-inset-bottom))] pt-5">
        <div>
          <Link
            to="/home"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <p className="eyebrow text-primary">Guía de publicaciones · {guide.name}</p>
          <h1 className="home-display mt-1.5 text-[clamp(1.55rem,6vw,2.1rem)] font-semibold leading-tight tracking-tight text-foreground">
            {guide.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{guide.intro}</p>
        </div>

        {guide.ready && guide.listadoImages.length > 0 && (
          <section className="space-y-3" aria-labelledby="listado-title">
            <h2
              id="listado-title"
              className="home-display text-xl font-semibold tracking-tight text-foreground"
            >
              Así se ven las publicaciones en el listado
            </h2>
            <div className="space-y-3">
              {guide.listadoImages.map((img) => (
                <figure
                  key={img.src}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-card/60"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-auto w-full"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}

        <Button
          asChild
          variant="accent"
          className="home-btn-cta h-11 w-full gap-2 rounded-xl text-sm font-semibold"
        >
          <a href={guide.siteUrl} target="_blank" rel="noopener noreferrer">
            Conoce cómo es la página — abre aquí
            <ExternalLink className="h-4 w-4 shrink-0 opacity-90" />
          </a>
        </Button>

        {guide.ready && guide.faqs.length > 0 && (
          <section className="space-y-4" aria-labelledby="faq-title">
            <h2
              id="faq-title"
              className="home-display text-xl font-semibold tracking-tight text-foreground"
            >
              Preguntas frecuentes sobre publicaciones
            </h2>
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-card/70">
              {guide.faqs.map((faq) => (
                <div key={faq.question} className="space-y-2 px-4 py-4">
                  <h3 className="text-[0.95rem] font-semibold leading-snug text-foreground">
                    {faq.question}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3 border-t border-white/5 pt-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Otras guías de publicaciones
          </p>
          <div className="flex flex-wrap gap-2">
            {ANUNCIOS_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => (
              <Link
                key={g.slug}
                to={anunciosGuidePath(g)}
                className="inline-flex h-9 items-center rounded-full border border-white/10 bg-card/80 px-3.5 text-sm font-medium text-foreground transition hover:border-accent/45 hover:bg-accent/10"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
