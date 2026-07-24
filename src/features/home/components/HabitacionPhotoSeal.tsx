import { cn } from '@/lib/utils'

/** Imagen por defecto cuando una habitación no tiene fotos. */
export const HABITACION_DEFAULT_COVER = '/habitacion-default.jpg'

interface HabitacionPhotoSealProps {
  className?: string
  compact?: boolean
}

/**
 * Sello centrado en visualización — igual en todas las fotos.
 * No se graba al subir (evita sellos dobles / inconsistentes).
 */
export function HabitacionPhotoSeal({ className, compact = false }: HabitacionPhotoSealProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-[1] overflow-hidden', className)}
      aria-hidden
    >
      <span
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 select-none whitespace-nowrap font-semibold tracking-wide text-white/35 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]',
          compact ? 'text-[9px]' : 'text-[clamp(0.95rem,3.8vw,1.35rem)] sm:text-lg',
        )}
      >
        Comunidadescort.cl
      </span>
    </div>
  )
}

export function habitacionCoverUrl(photos?: { url: string }[] | null): string {
  return photos?.[0]?.url || HABITACION_DEFAULT_COVER
}
