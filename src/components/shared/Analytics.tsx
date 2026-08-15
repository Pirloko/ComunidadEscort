import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, isAnalyticsEnabled, trackPageView } from '@/lib/analytics'

/** Inicializa GA4 y registra cada cambio de ruta (SPA). */
export function Analytics() {
  const location = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (!isAnalyticsEnabled()) return
    const path = `${location.pathname}${location.search}`
    trackPageView(path)
  }, [location.pathname, location.search])

  return null
}
