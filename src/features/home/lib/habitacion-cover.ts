/** Imagen por defecto cuando una habitación no tiene fotos. */
export const HABITACION_DEFAULT_COVER = '/habitacion-default.jpg'

export function habitacionCoverUrl(photos?: { url: string }[] | null): string {
  return photos?.[0]?.url || HABITACION_DEFAULT_COVER
}

export function isHabitacionVideoCover(
  photos?: { url: string }[] | null,
  videoUrl?: string | null,
  hasVideoCover?: boolean,
): boolean {
  return hasVideoCover || (!photos?.[0]?.url && !!videoUrl)
}
