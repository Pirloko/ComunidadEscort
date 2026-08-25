declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

/** Público por diseño (va en el cliente). Env lo puede sobreescribir. */
const MEASUREMENT_ID = (
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-TCBDHWBK49'
).trim()

export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID))
}

export function getMeasurementId(): string | undefined {
  return isAnalyticsEnabled() ? MEASUREMENT_ID : undefined
}

/**
 * Carga gtag.js una sola vez (GA4).
 * Importante: dataLayer debe recibir `arguments` (objeto), no un array
 * de rest params — si no, GA no procesa los hits.
 */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return
  if (document.getElementById('ga4-gtag')) return

  window.dataLayer = window.dataLayer || []
  // function (no arrow): necesitamos el objeto `arguments` nativo
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false, // SPA: page views vía trackPageView
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.id = 'ga4-gtag'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

/** Page view para React Router (cambia la URL sin recargar). */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || typeof window.gtag !== 'function') return
  // `config` con page_path es el patrón recomendado para SPA en GA4
  window.gtag('config', MEASUREMENT_ID, {
    page_path: path,
    page_title: title ?? document.title,
    page_location: `${window.location.origin}${path}`,
  })
}

/** Evento personalizado opcional (sin datos personales). */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (!isAnalyticsEnabled() || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
