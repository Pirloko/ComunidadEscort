import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { bannerService } from '@/services/banner.service'
import type { HomeBanner } from '@/types/admin'

/** Proporción estándar del carrusel (2:1). Subir banners 1200×600 px. */
const BANNER_ASPECT_CLASS = 'aspect-[2/1]'

const AUTO_MS = 5500

function BannerSlide({
  banner,
  priority,
}: {
  banner: HomeBanner
  priority: boolean
}) {
  const image = (
    <img
      src={banner.image_url!}
      alt={banner.title}
      className="h-full w-full object-contain object-center"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
    />
  )

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block h-full w-full"
        aria-label={`Publicidad: ${banner.title}`}
      >
        {image}
      </a>
    )
  }

  return image
}

export function HomePromoBannerCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['home-banners'],
    queryFn: () => bannerService.listActive(),
    staleTime: 1000 * 60 * 5,
  })

  const count = banners.length
  const activeIndex = count > 0 ? ((active % count) + count) % count : 0
  const current = banners[activeIndex]

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActive(((index % count) + count) % count)
    },
    [count],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = window.setInterval(goNext, AUTO_MS)
    return () => window.clearInterval(id)
  }, [count, paused, goNext])

  if (!isLoading && count === 0) return null

  return (
    <section
      className="home-promo-banner home-fade-up"
      aria-label="Publicidad"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.9)]">
        {isLoading ? (
          <Skeleton className={cn(BANNER_ASPECT_CLASS, 'w-full rounded-2xl')} />
        ) : (
          <>
            <div
              className={cn(
                'relative w-full bg-[#0a0a0c]',
                BANNER_ASPECT_CLASS,
              )}
              aria-live="polite"
            >
              {current && (
                <div
                  key={current.id}
                  className="home-promo-slide-enter absolute inset-0"
                >
                  <BannerSlide banner={current} priority={activeIndex === 0} />
                </div>
              )}
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  className="home-promo-nav home-promo-nav-prev"
                  onClick={goPrev}
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="home-promo-nav home-promo-nav-next"
                  onClick={goNext}
                  aria-label="Banner siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div
                  className="carousel-dots carousel-dots--light absolute inset-x-0 bottom-0 z-[3]"
                  role="tablist"
                  aria-label="Seleccionar banner"
                >
                  {banners.map((banner, i) => (
                    <button
                      key={banner.id}
                      type="button"
                      role="tab"
                      className="carousel-dot"
                      onClick={() => goTo(i)}
                      aria-label={`Ir al banner ${i + 1}: ${banner.title}`}
                      aria-selected={i === activeIndex}
                    >
                      <span className="carousel-dot-indicator" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
        Publicidad
      </p>
    </section>
  )
}
