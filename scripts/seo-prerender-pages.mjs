/**
 * Rutas públicas a prerenderizar (espejo de sitemap + copy SEO).
 * Mantener alineado con src/lib/seo-habitaciones.ts y anuncios-guides ready.
 */

export const ORIGIN = 'https://comunidadescort.cl'
export const OG_IMAGE = `${ORIGIN}/logo-icon.png`

export const CITIES = [
  { slug: 'santiago', name: 'Santiago' },
  { slug: 'valparaiso', name: 'Valparaíso' },
  { slug: 'vina-del-mar', name: 'Viña del Mar' },
  { slug: 'rancagua', name: 'Rancagua' },
  { slug: 'talca', name: 'Talca' },
  { slug: 'curico', name: 'Curicó' },
  { slug: 'chillan', name: 'Chillán' },
  { slug: 'concepcion', name: 'Concepción' },
  { slug: 'temuco', name: 'Temuco' },
  { slug: 'antofagasta', name: 'Antofagasta' },
  { slug: 'la-serena', name: 'La Serena' },
  { slug: 'puerto-montt', name: 'Puerto Montt' },
  { slug: 'arica', name: 'Arica' },
  { slug: 'iquique', name: 'Iquique' },
]

/** @typedef {{ path: string, title: string, description: string, h1: string, bodyHtml: string, jsonLd?: object }} SeoPage */

/** @returns {SeoPage[]} */
export function buildSeoPages() {
  const cityLinks = CITIES.map(
    (c) =>
      `<li><a href="/habitaciones-escort/${c.slug}">Habitaciones y piezas para escort en ${escapeHtml(c.name)}</a></li>`,
  ).join('\n')

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Comunidadescort.cl',
    url: `${ORIGIN}/home`,
    description:
      'Habitaciones para escort y piezas para escort en todo Chile. Busca por ciudad, contacta directo y cotiza hospedaje.',
    inLanguage: 'es-CL',
    about: {
      '@type': 'Thing',
      name: 'Habitaciones y piezas para escort en Chile',
    },
  }

  /** @type {SeoPage[]} */
  const pages = [
    {
      path: '/home',
      title: 'Habitaciones para escort y piezas escort en Chile | Comunidadescort',
      description:
        'Habitaciones para escort y piezas para escort en todo Chile. Busca por ciudad, contacta directo y cotiza hospedaje. Cobertura nacional en Comunidadescort.cl.',
      h1: 'Habitaciones para escort y piezas escort en Chile',
      bodyHtml: `
<main>
  <p>Directorio nacional · Chile</p>
  <h1>Habitaciones para escort y piezas escort en Chile</h1>
  <p>
    Busca habitaciones para escort o piezas para escort por ciudad en todo Chile.
    Contacta directo, cotiza hospedaje y elige la casa que mejor te acomode.
  </p>
  <h2>Ciudades con habitaciones para escort</h2>
  <ul>
    ${cityLinks}
  </ul>
  <p><a href="/guia-publicaciones-chimbis">Guías de publicaciones</a> · Comunidad privada en Comunidadescort.cl</p>
</main>`.trim(),
      jsonLd: homeJsonLd,
    },
  ]

  for (const city of CITIES) {
    const path = `/habitaciones-escort/${city.slug}`
    const title = `Habitaciones y piezas para escort en ${city.name} | Comunidadescort`
    const description = `Habitaciones para escort y piezas para escort en ${city.name}, Chile. Publicaciones activas en esta ciudad, contacto directo y opciones verificadas. También puedes ver el listado nacional.`
    const h1 = `Habitaciones y piezas para escort en ${city.name}`
    const otherCities = CITIES.filter((c) => c.slug !== city.slug)
      .slice(0, 8)
      .map(
        (c) =>
          `<li><a href="/habitaciones-escort/${c.slug}">${escapeHtml(c.name)}</a></li>`,
      )
      .join('\n')

    pages.push({
      path,
      title,
      description,
      h1,
      bodyHtml: `
<main>
  <p><a href="/home">Habitaciones para escort en Chile</a></p>
  <p>Piezas y habitaciones · ${escapeHtml(city.name)}</p>
  <h1>${escapeHtml(h1)}</h1>
  <p>
    Listado de habitaciones para escort y piezas para escort en ${escapeHtml(city.name)}.
    Si buscas en otras regiones de Chile, vuelve al
    <a href="/home">directorio nacional</a>.
  </p>
  <h2>Otras ciudades</h2>
  <ul>
    ${otherCities}
  </ul>
</main>`.trim(),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: h1,
        description,
        url: `${ORIGIN}${path}`,
        inLanguage: 'es-CL',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Comunidadescort.cl',
          url: `${ORIGIN}/home`,
        },
        about: {
          '@type': 'Place',
          name: city.name,
          addressCountry: 'CL',
        },
      },
    })
  }

  for (const guide of READY_GUIDES) {
    const path = `/${guide.path}`
    const faqLd =
      guide.faqs.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            url: `${ORIGIN}${path}`,
            mainEntity: guide.faqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }
        : undefined

    const faqHtml =
      guide.faqs.length > 0
        ? `<h2>Preguntas frecuentes</h2>
  <dl>
    ${guide.faqs
      .map(
        (f) =>
          `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`,
      )
      .join('\n    ')}
  </dl>`
        : ''

    pages.push({
      path,
      title: `${guide.title} | Comunidadescort`,
      description: guide.description,
      h1: guide.title,
      bodyHtml: `
<main>
  <p><a href="/home">Volver al inicio</a></p>
  <p>Guía de publicaciones · ${escapeHtml(guide.name)}</p>
  <h1>${escapeHtml(guide.title)}</h1>
  <p>${escapeHtml(guide.intro)}</p>
  ${faqHtml}
  <p><a href="${guide.siteUrl}" rel="noopener noreferrer">Sitio oficial de ${escapeHtml(guide.name)}</a></p>
</main>`.trim(),
      jsonLd: faqLd,
    })
  }

  return pages
}

const READY_GUIDES = [
  {
    path: 'guia-publicaciones-chimbis',
    name: 'Chimbis',
    siteUrl: 'https://chimbis.cl',
    title: 'Guía de publicaciones en Chimbis: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Chimbis Chile: cómo funcionan los avisos destacados TOP, Destacado, Historias, subidas y cómo se ven en el listado.',
    intro:
      'Chimbis es un portal de publicaciones y avisos destacados en Chile. La visibilidad de cada publicación depende del plan que elijas: zona, días, subidas y combos TOP / Destacado / Historias.',
    faqs: [
      {
        question: '¿Qué significan las «subidas» en Chimbis?',
        answer:
          'Cada subida es una vez que tu aviso vuelve a los primeros puestos del listado durante el período contratado.',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Destacado e Historias?',
        answer:
          'TOP te lleva a los primeros lugares. Destacado agrega mayor visibilidad. Historias incluye publicación en historias.',
      },
    ],
  },
  {
    path: 'guia-publicaciones-skokka',
    name: 'Skokka',
    siteUrl: 'https://cl.skokka.com',
    title: 'Guía de publicaciones en Skokka: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Skokka Chile: cómo funcionan los avisos destacados TOP, Súper Top, Top All in One, subidas y cómo se ven en el listado.',
    intro:
      'En Skokka las publicaciones destacadas compiten por los primeros lugares del listado. El plan y las subidas diarias definen la visibilidad.',
    faqs: [
      {
        question: '¿Qué significan las «subidas» en Skokka?',
        answer:
          'Cada subida es una vez que tu aviso vuelve automáticamente a los primeros puestos del listado.',
      },
    ],
  },
  {
    path: 'guia-publicaciones-locanto',
    name: 'Locanto',
    siteUrl: 'https://www.locanto.cl',
    title: 'Guía de publicaciones en Locanto: avisos destacados TOP y Galería',
    description:
      'Guía de publicaciones Locanto Chile (locanto.cl): avisos destacados por 7 días, rotación TOP y Galería, precios y cómo se ven en el listado.',
    intro:
      'En Locanto los avisos destacados duran 7 días. Puedes elegir TOP, Galería o TOP + Galería.',
    faqs: [
      {
        question: '¿Cuántos días dura un aviso destacado en Locanto?',
        answer: 'Los avisos destacados en Locanto son por 7 días.',
      },
    ],
  },
  {
    path: 'guia-publicaciones-simpleescorts',
    name: 'SimpleEscorts',
    siteUrl: 'https://cl.simpleescorts.com',
    title: 'Guía de publicaciones en SimpleEscorts: cómo funciona Super Turbo para Escort',
    description:
      'Guía de publicaciones SimpleEscorts Chile: Super Turbo, subidas por franja horaria, ventajas visuales, horarios y precios.',
    intro:
      'En SimpleEscorts el plan más visible es Super Turbo: foto más grande, etiqueta propia y subidas automáticas.',
    faqs: [
      {
        question: '¿Qué es Super Turbo en SimpleEscorts?',
        answer:
          'Es el plan más visible: foto más grande, etiqueta Super Turbo y subidas a los primeros lugares.',
      },
    ],
  },
  {
    path: 'guia-publicaciones-escorcitas',
    name: 'Escorcitas',
    siteUrl: 'https://escorcitas.cl',
    title: 'Guía de publicaciones en Escorcitas: cómo funcionan TOP, PREMIUM y GOLD',
    description:
      'Guía de publicaciones Escorcitas Chile: diferencia entre TOP, PREMIUM y GOLD, rotación de anuncios y cómo se ven en el listado.',
    intro:
      'En Escorcitas la visibilidad depende del plan: TOP, PREMIUM o GOLD.',
    faqs: [
      {
        question: '¿Qué diferencia hay entre TOP, PREMIUM y GOLD?',
        answer:
          'TOP, PREMIUM y GOLD tienen distinta etiqueta, cantidad de fotos/videos y rotación dentro de su categoría.',
      },
    ],
  },
]

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
