import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { whatsappUrl } from '@/lib/habitaciones'
import { bannerService } from '@/services/banner.service'
import type { HomeBanner } from '@/types/admin'

/** Proporción estándar del carrusel (2:1). Subir banners 1200×600 px. */
const BANNER_ASPECT_CLASS = 'aspect-[2/1]'

const AUTO_MS = 5500

function hasContactButtons(banner: HomeBanner): boolean {
  return Boolean(banner.instagram_url?.trim() || banner.whatsapp_phone?.trim())
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

function BannerSlide({
  banner,
  priority,
  contactsOpen,
  onToggleContacts,
}: {
  banner: HomeBanner
  priority: boolean
  contactsOpen: boolean
  onToggleContacts: () => void
}) {
  const image = (
    <img
      src={banner.image_url!}
      alt={banner.title}
      width={1200}
      height={600}
      className="h-full w-full object-contain object-center"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
    />
  )

  if (hasContactButtons(banner)) {
    return (
      <button
        type="button"
        onClick={onToggleContacts}
        className="block h-full w-full"
        aria-expanded={contactsOpen}
        aria-label={
          contactsOpen
            ? `Cerrar contactos de ${banner.title}`
            : `Ver contactos de ${banner.title}`
        }
      >
        {image}
      </button>
    )
  }

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

function BannerContactBar({ banner }: { banner: HomeBanner }) {
  const instagram = banner.instagram_url?.trim() || null
  const phone = banner.whatsapp_phone?.trim() || null
  if (!instagram && !phone) return null

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-background/95 px-3 py-2.5"
      role="group"
      aria-label={`Contactar ${banner.title}`}
    >
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-3 text-sm font-semibold text-white"
        >
          <InstagramIcon className="h-4 w-4 shrink-0" />
          Instagram
        </a>
      )}
      {phone && (
        <a
          href={whatsappUrl(phone, 'Hola, vi tu aviso en ComunidadEscort')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          WhatsApp
        </a>
      )}
    </div>
  )
}

export function HomePromoBannerCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)

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
      setContactsOpen(false)
      setActive(((index % count) + count) % count)
    },
    [count],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (count <= 1 || paused || contactsOpen) return
    const id = window.setInterval(goNext, AUTO_MS)
    return () => window.clearInterval(id)
  }, [count, paused, contactsOpen, goNext])

  if (!isLoading && count === 0) {
    return (
      <section
        className="home-promo-banner home-fade-up"
        aria-hidden="true"
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-2xl border border-white/10 bg-card/40',
            BANNER_ASPECT_CLASS,
          )}
        />
        <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Publicidad
        </p>
      </section>
    )
  }

  return (
    <section
      className="home-promo-banner home-fade-up"
      aria-label="Publicidad"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => {
        if (!contactsOpen) setPaused(false)
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.9)]">
        {isLoading ? (
          <Skeleton className={cn(BANNER_ASPECT_CLASS, 'w-full rounded-2xl')} />
        ) : (
          <>
            <div className="relative">
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
                    <BannerSlide
                      banner={current}
                      priority={activeIndex === 0}
                      contactsOpen={contactsOpen}
                      onToggleContacts={() => setContactsOpen((open) => !open)}
                    />
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

                  {!contactsOpen && (
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
                  )}
                </>
              )}
            </div>

            {current && contactsOpen && hasContactButtons(current) && (
              <BannerContactBar banner={current} />
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
