import { Play } from 'lucide-react'
import {
  HabitacionPhotoSeal,
  HABITACION_DEFAULT_COVER,
} from '@/features/home/components/HabitacionPhotoSeal'
import { cn } from '@/lib/utils'

export function isHabitacionVideoCover(
  photos?: { url: string }[] | null,
  videoUrl?: string | null,
): boolean {
  return !photos?.[0]?.url && !!videoUrl
}

interface HabitacionCardCoverProps {
  photos?: { url: string }[] | null
  videoUrl?: string | null
  alt: string
  className?: string
  /** Clases del media (img/video), p.ej. hover scale. */
  mediaClassName?: string
  showSeal?: boolean
}

/**
 * Portada de card/listado: foto → video (solo-video) → placeholder.
 * El play se renderiza aparte (HabitacionVideoPlayBadge) encima del gradiente.
 */
export function HabitacionCardCover({
  photos,
  videoUrl,
  alt,
  className,
  mediaClassName,
  showSeal = true,
}: HabitacionCardCoverProps) {
  const photo = photos?.[0]?.url
  const hasPhoto = !!photo
  const hasVideoOnly = !hasPhoto && !!videoUrl

  return (
    <div className={cn('relative h-full w-full bg-muted', className)}>
      {hasVideoOnly ? (
        <video
          src={`${videoUrl!}#t=0.001`}
          muted
          playsInline
          preload="metadata"
          className={cn('h-full w-full object-cover', mediaClassName)}
          aria-label={alt}
        />
      ) : (
        <>
          <img
            src={photo || HABITACION_DEFAULT_COVER}
            alt={alt}
            className={cn('h-full w-full object-cover', mediaClassName)}
            loading="lazy"
            draggable={false}
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
