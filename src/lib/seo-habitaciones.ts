/** Rutas y meta SEO para listados públicos por ciudad y páginas indexables */

const APP_ORIGIN = 'https://comunidadescort.cl'
const DEFAULT_OG_IMAGE = `${APP_ORIGIN}/logo-icon.png`

export function habitacionesEscortCityPath(citySlug: string): string {
  return `/habitaciones-escort/${citySlug}`
}

export function piezasEscortCityPath(citySlug: string): string {
  return `/piezas-escort/${citySlug}`
}

export function alcobasEscortCityPath(citySlug: string): string {
  return `/alcobas-escort/${citySlug}`
}

/** Parsea URLs legacy tipo /habitaciones-escort-puerto-montt */
export function parseLegacyEscortCityPath(
  segment: string,
): { kind: 'habitaciones' | 'piezas' | 'alcobas' | 'alcoba'; citySlug: string } | null {
  const m = segment.match(/^(habitaciones|piezas|alcobas|alcoba)-escort-(.+)$/i)
  if (!m) return null
  return {
    kind: m[1]!.toLowerCase() as 'habitaciones' | 'piezas' | 'alcobas' | 'alcoba',
    citySlug: m[2]!,
  }
}

/** Home nacional: pelea keywords genéricas (no ciudad). */
export const HOME_SEO = {
  title: 'Habitaciones para escort y piezas escort en Chile | Comunidadescort',
  description:
    'Habitaciones para escort y piezas para escort en todo Chile. Busca por ciudad, contacta directo y cotiza hospedaje. Cobertura nacional en Comunidadescort.cl.',
  path: '/home',
} as const

export function citySeoTitle(cityName: string): string {
  return `Habitaciones y piezas para escort en ${cityName} | Comunidadescort`
}

export function citySeoDescription(cityName: string): string {
  return `Habitaciones para escort y piezas para escort en ${cityName}, Chile. Publicaciones activas en esta ciudad, contacto directo y opciones verificadas. También puedes ver el listado nacional.`
}

export function citySeoH1(cityName: string): string {
  return `Habitaciones y piezas para escort en ${cityName}`
}

export function citySeoIntro(cityName: string, count: number): string {
  const n =
    count === 1
      ? '1 publicación activa'
      : `${count} publicaciones activas`
  return `Listado de habitaciones para escort y piezas para escort en ${cityName}. ${n} en esta ciudad. Si buscas en otras regiones de Chile, vuelve al directorio nacional.`
}

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = href
}

function upsertJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  let script = existing as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

export type DocumentMetaOptions = {
  title: string
  description: string
  /** Ruta canónica sin origen, ej. /home. Default: pathname actual. */
  path?: string
  image?: string
  noindex?: boolean
  jsonLd?: object | object[] | null
}

export function setDocumentMeta(opts: DocumentMetaOptions) {
  const path =
    opts.path ??
    (typeof window !== 'undefined' ? window.location.pathname : HOME_SEO.path)
  const canonicalUrl = `${APP_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
  const image = opts.image ?? DEFAULT_OG_IMAGE

  document.title = opts.title
  upsertMetaByName('description', opts.description)
  upsertMetaByName('robots', opts.noindex ? 'noindex,follow' : 'index,follow')
  upsertCanonical(canonicalUrl)

  upsertMetaByProperty('og:type', 'website')
  upsertMetaByProperty('og:locale', 'es_CL')
  upsertMetaByProperty('og:site_name', 'Comunidadescort.cl')
  upsertMetaByProperty('og:title', opts.title)
  upsertMetaByProperty('og:description', opts.description)
  upsertMetaByProperty('og:url', canonicalUrl)
  upsertMetaByProperty('og:image', image)

  upsertMetaByName('twitter:card', 'summary')
  upsertMetaByName('twitter:title', opts.title)
  upsertMetaByName('twitter:description', opts.description)
  upsertMetaByName('twitter:image', image)

  // Siempre sincronizar: si la página no pasa jsonLd, se elimina el anterior
  upsertJsonLd('seo-jsonld', opts.jsonLd ?? null)
}

export function buildFaqPageJsonLd(
  pageUrl: string,
  faqs: { question: string; answer: string }[],
): object | null {
  if (faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
    url: pageUrl,
  }
}

export function buildHomeJsonLd(cityNames: string[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Comunidadescort.cl',
    url: `${APP_ORIGIN}/home`,
    description: HOME_SEO.description,
    inLanguage: 'es-CL',
    about: {
      '@type': 'Thing',
      name: 'Habitaciones y piezas para escort en Chile',
    },
    ...(cityNames.length > 0
      ? {
          mentions: cityNames.slice(0, 20).map((name) => ({
            '@type': 'Place',
            name,
            addressCountry: 'CL',
          })),
        }
      : {}),
  }
}

export function buildCityJsonLd(cityName: string, citySlug: string, count: number): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: citySeoH1(cityName),
    description: citySeoDescription(cityName),
    url: `${APP_ORIGIN}${habitacionesEscortCityPath(citySlug)}`,
    inLanguage: 'es-CL',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Comunidadescort.cl',
      url: `${APP_ORIGIN}/home`,
    },
    about: {
      '@type': 'Place',
      name: cityName,
      addressCountry: 'CL',
    },
    numberOfItems: count,
  }
}
