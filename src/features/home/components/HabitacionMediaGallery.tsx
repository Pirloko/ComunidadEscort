import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResourcePhoto } from '@/types/resources'

type MediaItem =
  | { type: 'photo'; id: string; url: string }
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const posterUrl = photos[0]?.url

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const active = items[activeIdx]
    if (active?.type !== 'video') {
      video.pause()
    }
  }, [activeIdx, items])

  useEffect(() => {
    const container = thumbsRef.current
    const thumb = container?.children[activeIdx] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIdx])

  if (items.length === 0) return null

  const active = items[activeIdx] ?? items[0]
  const showThumbs = items.length > 1
  const canGoPrev = activeIdx > 0
  const canGoNext = activeIdx < items.length - 1

  function goTo(idx: number) {
    setActiveIdx(Math.max(0, Math.min(items.length - 1, idx)))
  }

  return (
    <div className={cn('habitacion-gallery-frame', className)}>
      <div className="relative aspect-[4/3] bg-black">
        {active.type === 'photo' ? (
          <img
            key={`photo-${activeIdx}`}
            src={active.url}
            alt={alt}
            className="habitacion-gallery-media habitacion-gallery-ken-burns h-full w-full object-cover"
          />
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
            className="habitacion-gallery-media h-full w-full object-contain bg-black"
          />
        )}

        <div className="habitacion-gallery-vignette" aria-hidden />

        {items.length > 1 && (
          <>
            <div className="habitacion-gallery-counter absolute right-3 top-3 z-10 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
              {activeIdx + 1} / {items.length}
            </div>

            {canGoPrev && (
              <button
                type="button"
                onClick={() => goTo(activeIdx - 1)}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {canGoNext && (
              <button
                type="button"
                onClick={() => goTo(activeIdx + 1)}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
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
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt=""
                          className="h-full w-full object-cover brightness-[0.65] saturate-75"
                        />
                      ) : (
                        <div className="h-full w-full bg-zinc-900" />
                      )}
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
  )
}
