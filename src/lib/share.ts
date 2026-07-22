import { APP_NAME, APP_URL } from '@/lib/constants'

/** URL absoluta de la app (sin slash final). */
export function getAppBaseUrl(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || APP_URL
  if (typeof window !== 'undefined' && (!base || base.includes('localhost'))) {
    // En móvil local usa el origen actual (útil con --host)
    return window.location.origin
  }
  return base.replace(/\/$/, '')
}

export function absoluteAppUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getAppBaseUrl()}${normalized}`
}

/** Abre WhatsApp con un mensaje (sin número destino = elegir chat). */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function shareClienteAlertText(opts: {
  kind: 'funar' | 'recomendar'
  title: string
  clientNumber?: string | null
  path: string
}): string {
  const tipo = opts.kind === 'funar' ? 'Funa de cliente' : 'Recomendación de cliente'
  const lines = [
    `${APP_NAME} — ${tipo}`,
    opts.title,
  ]
  if (opts.clientNumber) lines.push(`Cliente: ${opts.clientNumber}`)
  lines.push('', absoluteAppUrl(opts.path))
  return lines.join('\n')
}

export function shareCasaReviewText(opts: {
  isFuna: boolean
  houseName: string
  rating: number
  path: string
}): string {
  const tipo = opts.isFuna ? 'Funa de casa' : 'Recomendación de casa'
  return [
    `${APP_NAME} — ${tipo}`,
    `${opts.houseName} (${opts.rating}/5)`,
    '',
    absoluteAppUrl(opts.path),
  ].join('\n')
}

export function shareCasaPageText(opts: { houseName: string; path: string }): string {
  return [
    `${APP_NAME} — Casa / habitación`,
    opts.houseName,
    '',
    absoluteAppUrl(opts.path),
  ].join('\n')
}
