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
  isActive,
  priority,
}: {
  banner: HomeBanner
  isActive: boolean
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

  const content = banner.link_url ? (
    <a
      href={banner.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block h-full w-full"
      aria-label={`Publicidad: ${banner.title}`}
    >
      {image}
    </a>
  ) : (
    image
  )

  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-500 ease-out',
        isActive ? 'z-[2] opacity-100' : 'z-[1] pointer-events-none opacity-0',
      )}
      aria-hidden={!isActive}
    >
      {content}
    </div>
  )
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

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActive(((index % count) + count) % count)
    },
    [count],
  )

  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = window.setInterval(goNext, AUTO_MS)
    return () => window.clearInterval(id)
  }, [count, paused, goNext])

  useEffect(() => {
    if (active >= count && count > 0) setActive(0)
  }, [active, count])

  if (!isLoading && count === 0) return null

  return (
    <section
      className="home-promo-banner home-fade-up"
      aria-label="Publicidad"
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
            >
              {banners.map((banner, i) => (
                <BannerSlide
                  key={banner.id}
                  banner={banner}
                  isActive={i === active}
                  priority={i === 0}
                />
              ))}
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

                <div className="absolute inset-x-0 bottom-2 z-[3] flex justify-center gap-1.5">
                  {banners.map((banner, i) => (
                    <button
                      key={banner.id}
                      type="button"
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40',
                      )}
                      onClick={() => goTo(i)}
                      aria-label={`Ir al banner ${i + 1}`}
                      aria-current={i === active ? 'true' : undefined}
                    />
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
