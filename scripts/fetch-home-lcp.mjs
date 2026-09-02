/**
 * Obtiene la imagen LCP del home (primer banner activo) para prerender post-build.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../.env') })

/**
 * @returns {Promise<{ imageUrl: string, title: string } | null>}
 */
export async function fetchHomeLcp() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[fetch-home-lcp] Sin VITE_SUPABASE_URL / ANON_KEY — omitiendo LCP dinámico.')
    return null
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('home_banners')
    .select('image_url, title')
    .eq('is_active', true)
    .not('image_url', 'is', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[fetch-home-lcp]', error.message)
    return null
  }
  if (!data?.image_url) return null

  const imageUrl = String(data.image_url).split('?')[0]
  return { imageUrl, title: data.title ?? 'Publicidad' }
}
