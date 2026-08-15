declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID))
}

/** Carga gtag.js una sola vez (GA4). */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return
  if (document.getElementById('ga4-gtag')) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false, // lo controlamos en el router (SPA)
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
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
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
