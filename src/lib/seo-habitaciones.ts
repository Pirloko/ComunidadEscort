/** Rutas y meta SEO para listados públicos por ciudad */

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

export function citySeoTitle(cityName: string): string {
  return `Habitaciones y piezas para escort en ${cityName} | Comunidadescort`
}

export function citySeoDescription(cityName: string): string {
  return `Habitaciones o piezas para escort en ${cityName}. Publicaciones activas, contacto directo y opciones verificadas en Comunidadescort.cl.`
}

export function citySeoH1(cityName: string): string {
  return `Habitaciones y piezas para escort en ${cityName}`
}

export function setDocumentMeta(opts: { title: string; description: string }) {
  document.title = opts.title

  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', opts.description)

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${window.location.origin}${window.location.pathname}`
}
