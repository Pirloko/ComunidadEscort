/**
 * URLs de Storage Supabase optimizadas para caché CDN y tamaños de display.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')

export type PhotoDisplaySize = 'card' | 'detail' | 'full'

export const PHOTO_BUCKET = 'resource-photos'

/** Paths de habitaciones públicas: public/{resourceId}/… */
export function isPublicStoragePath(path: string): boolean {
  return path.replace(/^\//, '').startsWith('public/')
}

export function storagePublicObjectUrl(bucket: string, path: string): string {
  const clean = path.replace(/^\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(clean)}`
}

/** Transform on-the-fly (Pro). Fallback: URL pública sin transformar. */
export function storageRenderedImageUrl(
  bucket: string,
  path: string,
  opts?: { width?: number; quality?: number },
): string {
  const clean = path.replace(/^\//, '')
  const base = `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${encodeURI(clean)}`
  const params = new URLSearchParams()
  if (opts?.width) params.set('width', String(opts.width))
  params.set('quality', String(opts?.quality ?? 80))
  params.set('resize', 'contain')
  return `${base}?${params.toString()}`
}

export function detailPhotoPathToCardPath(path: string): string {
  return path.replace(/\.webp$/i, '-card.webp')
}

/**
 * URL de display según contexto.
 * - public/: CDN estable (sin token firmado).
 * - card: variante -card.webp o render 480px.
 */
export function photoDisplayUrl(path: string, size: PhotoDisplaySize = 'full'): string {
  const clean = path.replace(/^\//, '')
  if (!isPublicStoragePath(clean)) return path

  if (size === 'card') {
    return storagePublicObjectUrl(PHOTO_BUCKET, detailPhotoPathToCardPath(clean))
  }
  if (size === 'detail') {
    return storageRenderedImageUrl(PHOTO_BUCKET, clean, { width: 960, quality: 82 })
  }
  return storagePublicObjectUrl(PHOTO_BUCKET, clean)
}

export function getSupabaseOrigin(): string | null {
  if (!SUPABASE_URL) return null
  try {
    return new URL(SUPABASE_URL).origin
  } catch {
    return null
  }
}
