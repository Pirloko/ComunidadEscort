/**
 * Obtiene la imagen LCP del home (primer banner activo) para prerender post-build.
 * Usa PostgREST vía fetch (sin @supabase/supabase-js) para evitar WebSocket en Node 20.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../.env') })

/**
 * @returns {Promise<{ imageUrl: string, title: string } | null>}
 */
export async function fetchHomeLcp() {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[fetch-home-lcp] Sin VITE_SUPABASE_URL / ANON_KEY — omitiendo LCP dinámico.')
    return null
  }

  try {
    const endpoint = new URL(`${url}/rest/v1/home_banners`)
    endpoint.searchParams.set('select', 'image_url,title')
    endpoint.searchParams.set('is_active', 'eq.true')
    endpoint.searchParams.set('image_url', 'not.is.null')
    endpoint.searchParams.set('order', 'sort_order.asc,created_at.asc')
    endpoint.searchParams.set('limit', '1')

    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`[fetch-home-lcp] HTTP ${res.status}: ${await res.text()}`)
      return null
    }

    const rows = await res.json()
    const data = Array.isArray(rows) ? rows[0] : null
    if (!data?.image_url) return null

    const imageUrl = String(data.image_url).split('?')[0]
    return { imageUrl, title: data.title ?? 'Publicidad' }
  } catch (err) {
    console.warn('[fetch-home-lcp]', err instanceof Error ? err.message : err)
    return null
  }
}
