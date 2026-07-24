import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Play, Expand, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  HABITACION_DEFAULT_COVER,
  HabitacionPhotoSeal,
} from '@/features/home/components/HabitacionPhotoSeal'
import type { ResourcePhoto } from '@/types/resources'

type MediaItem =
  | { type: 'photo'; id: string; url: string; isDefault?: boolean }
  | { type: 'video'; url: string }

interface HabitacionMediaGalleryProps {
  photos?: ResourcePhoto[]
  videoUrl?: string | null
  alt: string
  className?: string
}

function buildMediaItems(photos: ResourcePhoto[], videoUrl: string | null): MediaItem[] {
  const items: MediaItem[] = photos.map((p) => ({
    type: 'photo',
    id: p.id,
    url: p.url,
  }))

  if (items.length === 0) {
    items.push({
      type: 'photo',
      id: 'default-cover',
      url: HABITACION_DEFAULT_COVER,
      isDefault: true,
    })
  }

  if (videoUrl) {
    items.push({ type: 'video', url: videoUrl })
  }
  return items
}

export function HabitacionMediaGallery({
  photos = [],
  videoUrl = null,
  alt,
  className,
}: HabitacionMediaGalleryProps) {
  const items = useMemo(() => buildMediaItems(photos, videoUrl), [photos, videoUrl])
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lightboxVideoRef = useRef<HTMLVideoElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const posterUrl =
    photos[0]?.url ?? (items[0]?.type === 'photo' ? items[0].url : HABITACION_DEFAULT_COVER)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (items[activeIdx]?.type !== 'video') video.pause()
  }, [activeIdx, items])

  useEffect(() => {
    if (!lightboxOpen) {
      lightboxVideoRef.current?.pause()
      return
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxOpen])

  useEffect(() => {
    const container = thumbsRef.current
    const thumb = container?.children[activeIdx] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIdx])

  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') {
        setActiveIdx((i) => Math.max(0, i - 1))
      }
      if (e.key === 'ArrowRight') {
        setActiveIdx((i) => Math.min(items.length - 1, i + 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, items.length])

  const active = items[activeIdx] ?? items[0]
  const showThumbs = items.length > 1
  const canGoPrev = activeIdx > 0
  const canGoNext = activeIdx < items.length - 1

  function goTo(idx: number) {
    setActiveIdx(Math.max(0, Math.min(items.length - 1, idx)))
  }

  function openLightbox() {
    if (active.type === 'photo' && active.isDefault) return
    setLightboxOpen(true)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 48) return
    if (dx > 0) goTo(activeIdx - 1)
    else goTo(activeIdx + 1)
  }

  const lightbox =
    lightboxOpen &&
    createPortal(
      <div
        className="habitacion-lightbox fixed inset-0 z-[100] flex flex-col bg-black/96"
        role="dialog"
        aria-modal="true"
        aria-label="Ver foto completa"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="text-sm font-medium tabular-nums text-white/80">
            {activeIdx + 1} / {items.length}
          </p>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
          {active.type === 'photo' ? (
            <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
              <img
                key={`lb-photo-${activeIdx}`}
                src={active.url}
                alt={alt}
                className="habitacion-lightbox-media max-h-[min(100%,calc(100dvh-8.5rem))] max-w-full object-contain"
                draggable={false}
              />
              {!active.isDefault && <HabitacionPhotoSeal />}
            </div>
          ) : (
            <video
              ref={lightboxVideoRef}
              key={`lb-video-${active.url}`}
              src={active.url}
              controls
              autoPlay
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              poster={posterUrl}
              onContextMenu={(e) => e.preventDefault()}
              className="habitacion-lightbox-media max-h-full max-w-full object-contain"
            />
          )}

          {items.length > 1 && (
            <>
              {canGoPrev && (
                <button
                  type="button"
                  onClick={() => goTo(activeIdx - 1)}
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {canGoNext && (
                <button
                  type="button"
                  onClick={() => goTo(activeIdx + 1)}
                  aria-label="Siguiente"
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </>
          )}
        </div>

        <p className="pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-white/45">
          Desliza o usa las flechas · Esc para cerrar
        </p>
      </div>,
      document.body,
    )

  return (
    <>
      <div className={cn('habitacion-gallery-frame', className)}>
        <div
          className="relative aspect-[4/3] bg-black"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {active.type === 'photo' ? (
            <button
              type="button"
              onClick={openLightbox}
              className="absolute inset-0 z-[1] block h-full w-full cursor-zoom-in"
              aria-label="Ver foto completa"
            >
              <img
                key={`photo-${activeIdx}`}
                src={active.url}
                alt={alt}
                className="habitacion-gallery-media h-full w-full object-contain"
                draggable={false}
              />
              {!active.isDefault && <HabitacionPhotoSeal />}
            </button>
          ) : (
            <video
              ref={videoRef}
              key={active.url}
              src={active.url}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              poster={posterUrl}
              onContextMenu={(e) => e.preventDefault()}
              className="habitacion-gallery-media relative z-[1] h-full w-full object-contain bg-black"
            />
          )}

          {active.type === 'photo' && !active.isDefault && (
            <button
              type="button"
              onClick={openLightbox}
              aria-label="Ampliar"
              className="absolute bottom-3 left-3 z-20 flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/70"
            >
              <Expand className="h-3.5 w-3.5" />
              Ampliar
            </button>
          )}

          {items.length > 1 && (
            <>
              <div className="habitacion-gallery-counter absolute left-3 top-3 z-20 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
                {activeIdx + 1} / {items.length}
              </div>

              {canGoPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goTo(activeIdx - 1)
                  }}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {canGoNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goTo(activeIdx + 1)
                  }}
                  aria-label="Siguiente"
                  className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        </div>

        {showThumbs && (
          <div className="habitacion-gallery-thumbs p-3">
            <div
              ref={thumbsRef}
              className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, i) => {
                const isActive = i === activeIdx
                const isVideo = item.type === 'video'

                return (
                  <button
                    key={isVideo ? 'video' : item.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={isVideo ? 'Ver video' : `Ver foto ${i + 1}`}
                    className={cn(
                      'habitacion-gallery-thumb relative h-[4.25rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl border-2',
                      isActive
                        ? 'habitacion-gallery-thumb-active border-accent opacity-100'
                        : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    {isVideo ? (
                      <>
                        <img
                          src={posterUrl}
                          alt=""
                          className="h-full w-full object-cover brightness-[0.65] saturate-75"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {lightbox}
    </>
  )
}
