import { Play } from 'lucide-react'
import {
  HabitacionPhotoSeal,
} from '@/features/home/components/HabitacionPhotoSeal'
import { HABITACION_DEFAULT_COVER } from '@/features/home/lib/habitacion-cover'
import { cn } from '@/lib/utils'
import type { ResourcePhoto } from '@/types/resources'

interface HabitacionCardCoverProps {
  photos?: ResourcePhoto[] | null
  videoUrl?: string | null
  /** Portada solo-video en listado (sin descargar el MP4) */
  hasVideoCover?: boolean
  alt: string
  className?: string
  /** Clases del media (img/video), p.ej. hover scale. */
  mediaClassName?: string
  showSeal?: boolean
  /** Primera slide / above-the-fold */
  priority?: boolean
  /** URL de respaldo si la variante card (-card.webp) aún no existe */
  photoFallbackUrl?: string
}

/**
 * Portada de card/listado: foto → placeholder video → placeholder.
 * El play se renderiza aparte (HabitacionVideoPlayBadge) encima del gradiente.
 */
export function HabitacionCardCover({
  photos,
  videoUrl,
  hasVideoCover = false,
  alt,
  className,
  mediaClassName,
  showSeal = true,
  priority = false,
  photoFallbackUrl,
}: HabitacionCardCoverProps) {
  const photo = photos?.[0]?.url
  const fallback = photoFallbackUrl ?? photos?.[0]?.fallback_url
  const hasPhoto = !!photo
  const showVideoPlaceholder = !hasPhoto && (hasVideoCover || !!videoUrl)
  const imgSrc = photo || HABITACION_DEFAULT_COVER

  return (
    <div className={cn('relative h-full w-full bg-muted', className)}>
      {showVideoPlaceholder ? (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br from-muted via-card to-muted',
            mediaClassName,
          )}
          role="img"
          aria-label={alt}
        />
      ) : (
        <>
          <img
            src={imgSrc}
            alt={alt}
            className={cn('h-full w-full object-cover', mediaClassName)}
            width={462}
            height={616}
            sizes="(max-width: 640px) 92vw, 462px"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            draggable={false}
            onError={(e) => {
              if (fallback && e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback
              }
            }}
          />
          {hasPhoto && showSeal && <HabitacionPhotoSeal />}
        </>
      )}
    </div>
  )
}

/** Botón play decorativo — el Link padre navega al detalle. */
export function HabitacionVideoPlayBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-0 z-[3] flex items-center justify-center',
        className,
      )}
      aria-hidden
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.8)] backdrop-blur-md sm:h-16 sm:w-16">
        <Play className="ml-0.5 h-7 w-7 fill-current sm:h-8 sm:w-8" />
      </span>
    </span>
  )
}
