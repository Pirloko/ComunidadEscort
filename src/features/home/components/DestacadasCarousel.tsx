import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  HabitacionCardCover,
  HabitacionVideoPlayBadge,
} from '@/features/home/components/HabitacionCardCover'
import { isHabitacionVideoCover } from '@/features/home/lib/habitacion-cover'
import { FEATURED_HABITACIONES_LIMIT } from '@/lib/habitaciones'
import { cn } from '@/lib/utils'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'

function DestacadaSlide({ habitacion, priority }: { habitacion: Resource; priority?: boolean }) {
  const detailTo = `/home/habitaciones/${habitacion.id}`
  const videoCover = isHabitacionVideoCover(
    habitacion.photos,
    habitacion.video_url,
    habitacion.has_video_cover,
  )

  return (
    <article className="destacadas-slide group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-card/90 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)]">
      <Link to={detailTo} className="block">
        <div className="relative aspect-[3/4] min-h-[22rem] overflow-hidden bg-muted sm:min-h-[26rem]">
          <HabitacionCardCover
            photos={habitacion.photos}
            videoUrl={habitacion.video_url}
            hasVideoCover={habitacion.has_video_cover}
            alt={habitacion.name}
            priority={priority}
            mediaClassName="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          {videoCover && <HabitacionVideoPlayBadge />}
          {habitacion.city && (
            <span className="absolute left-3 top-3 z-[4] inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5" />
              {habitacion.city.name}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 z-[4] space-y-1.5 p-5">
            <h3 className="home-display text-[clamp(1.35rem,5vw,1.75rem)] font-semibold leading-tight text-white drop-shadow">
              {habitacion.name}
            </h3>
            <p className="text-sm font-medium text-white/75">Ver detalle →</p>
          </div>
        </div>
      </Link>
    </article>
  )
}

export function DestacadasCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const { data: featured = [], isLoading } = useQuery({
    queryKey: ['public-habitaciones-featured'],
    queryFn: () => resourceService.getFeaturedPublicHabitaciones(FEATURED_HABITACIONES_LIMIT),
    staleTime: 1000 * 60 * 5,
  })

  const rafRef = useRef<number | null>(null)

  const updateScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const nextCanPrev = el.scrollLeft > 8
    const nextCanNext = el.scrollLeft < maxScroll - 8

    const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-destacada-slide]'))
    let nextActive = 0
    if (slides.length > 0) {
      const center = el.scrollLeft + el.clientWidth / 2
      let bestDist = Infinity
      slides.forEach((slide, i) => {
        const mid = slide.offsetLeft + slide.offsetWidth / 2
        const dist = Math.abs(mid - center)
        if (dist < bestDist) {
          bestDist = dist
          nextActive = i
        }
      })
    }

    setCanPrev((prev) => (prev === nextCanPrev ? prev : nextCanPrev))
    setCanNext((prev) => (prev === nextCanNext ? prev : nextCanNext))
    setActive((prev) => (prev === nextActive ? prev : nextActive))
  }, [])

  const scheduleScrollState = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updateScrollState()
    })
  }, [updateScrollState])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', scheduleScrollState, { passive: true })
    window.addEventListener('resize', scheduleScrollState)
    return () => {
      el.removeEventListener('scroll', scheduleScrollState)
      window.removeEventListener('resize', scheduleScrollState)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [featured.length, scheduleScrollState, updateScrollState])

  const scrollBySlide = (dir: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>('[data-destacada-slide]')
    const amount = slide ? slide.offsetWidth + 14 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  if (!isLoading && featured.length === 0) return null

  return (
    <section className="destacadas-section space-y-4" aria-labelledby="destacadas-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="destacadas-title" className="destacadas-title home-display">
          Destacadas
        </h2>
        {featured.length > 1 && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => scrollBySlide(-1)}
              disabled={!canPrev}
              aria-label="Anterior"
              className="destacadas-nav-btn"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBySlide(1)}
              disabled={!canNext}
              aria-label="Siguiente"
              className="destacadas-nav-btn"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-[22rem] w-[92%] shrink-0 rounded-2xl sm:h-[26rem]" />
          <Skeleton className="h-[22rem] w-[92%] shrink-0 rounded-2xl sm:h-[26rem]" />
        </div>
      ) : (
        <>
          <div
            ref={trackRef}
            className="destacadas-track -mx-3 flex gap-3.5 overflow-x-auto px-3 pb-2 pt-1"
          >
            {featured.map((h, i) => (
              <div
                key={h.id}
                data-destacada-slide
                className={cn(
                  'destacadas-slide-wrap',
                  i === active && 'destacadas-slide-wrap-active',
                )}
              >
                <DestacadaSlide habitacion={h} priority={i === 0} />
              </div>
            ))}
          </div>

          {featured.length > 1 && (
            <div
              className="carousel-dots carousel-dots--accent"
              role="tablist"
              aria-label="Seleccionar destacada"
            >
              {featured.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  role="tab"
                  className="carousel-dot"
                  onClick={() => {
                    const el = trackRef.current
                    const slide = el?.querySelectorAll<HTMLElement>('[data-destacada-slide]')[i]
                    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                  }}
                  aria-label={`Ir a destacada ${i + 1}: ${h.name}`}
                  aria-selected={i === active}
                >
                  <span className="carousel-dot-indicator" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
