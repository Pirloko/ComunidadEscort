import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, isAnalyticsEnabled, trackPageView } from '@/lib/analytics'

/** Inicializa GA4 y registra cada cambio de ruta (SPA). */
export function Analytics() {
  const location = useLocation()
  const ready = useRef(false)

  useEffect(() => {
    initAnalytics()
    ready.current = true
  }, [])

  useEffect(() => {
    if (!isAnalyticsEnabled()) return
    // Asegura init en el mismo tick del primer render
    if (!ready.current) {
      initAnalytics()
      ready.current = true
    }
    const path = `${location.pathname}${location.search}`
    trackPageView(path)
  }, [location.pathname, location.search])

  return null
}
