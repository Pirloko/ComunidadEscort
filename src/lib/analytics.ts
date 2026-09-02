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
 * Stub inmediato + script diferido para no competir con LCP.
 */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return
  if (document.getElementById('ga4-gtag')) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const inject = () => {
    if (document.getElementById('ga4-gtag')) return
    const script = document.createElement('script')
    script.id = 'ga4-gtag'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    document.head.appendChild(script)
  }

  // Diferir red de GA: prioriza paint / LCP
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(inject, { timeout: 5000 })
  } else {
    window.setTimeout(inject, 3000)
  }
}

/** Page view para React Router (cambia la URL sin recargar). */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || typeof window.gtag !== 'function') return
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
