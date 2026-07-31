export type AnunciosGuideFaq = {
  question: string
  answer: string
}

export type AnunciosGuide = {
  /** Identificador corto del portal */
  slug: string
  /** Segmento de URL con keywords SEO (sin slash inicial) */
  path: string
  name: string
  /** Título SEO / H1 */
  title: string
  description: string
  /** Resumen corto bajo el título */
  intro: string
  /** Captura “así se ven en el listado”; null = aún sin material */
  listadoImage: string | null
  listadoAlt: string
  faqs: AnunciosGuideFaq[]
  /** false = chip visible pero página “próximamente” */
  ready: boolean
}

export const ANUNCIOS_GUIDES: AnunciosGuide[] = [
  {
    slug: 'chimbis',
    path: 'guia-publicaciones-chimbis',
    name: 'Chimbis',
    title: 'Guía de publicaciones en Chimbis: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Chimbis Chile: cómo funcionan los avisos destacados TOP, Destacado, Historias, subidas y cómo se ven en el listado.',
    intro:
      'Chimbis es un portal de publicaciones y avisos destacados en Chile. La visibilidad de cada publicación depende del plan que elijas: zona, días, subidas y combos TOP / Destacado / Historias.',
    listadoImage: '/guias/chimbis-listado.png',
    listadoAlt:
      'Ejemplos de publicaciones TOP, Destacado e Historias en el listado de Chimbis',
    ready: true,
    faqs: [
      {
        question: '¿Cómo funciona una publicación destacada en Chimbis?',
        answer:
          'Tocas si publicas en Santiago/Región Metropolitana u otra ciudad del norte o sur de Chile. Luego defines los días, las subidas (cuántas veces sube a los primeros lugares) y el plan: TOP, TOP + Destacado, TOP + Historias o la combinación completa.',
      },
      {
        question: '¿Qué significan las «subidas» en Chimbis?',
        answer:
          'Cada subida es una vez que tu publicación vuelve a los primeros puestos del listado durante el período contratado. Puedes elegir distintas cantidades según la zona y los días.',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Destacado e Historias?',
        answer:
          'TOP te lleva a los primeros lugares. Destacado agrega mayor visibilidad en el listado. Historias incluye publicación en historias. Puedes combinarlos según el plan que definas.',
      },
      {
        question: '¿Puedo subir fotos y videos en mi publicación?',
        answer:
          'Sí. En Chimbis solo se aceptan publicaciones destacadas con fotos 100% reales y comprobables. También puedes subir videos.',
      },
    ],
  },
  {
    slug: 'skokka',
    path: 'guia-publicaciones-skokka',
    name: 'Skokka',
    title: 'Guía de publicaciones en Skokka: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Skokka Chile: cómo funcionan los avisos destacados TOP, Súper Top, Top All in One, subidas y cómo se ven en el listado.',
    intro:
      'En Skokka las publicaciones destacadas compiten por los primeros lugares del listado. El plan (TOP, Súper Top o Top All in One) y las subidas diarias definen cuánta visibilidad tiene tu aviso.',
    listadoImage: '/guias/skokka-listado.png',
    listadoAlt:
      'Ejemplos de publicaciones TOP, Súper Top y Top All in One en el listado de Skokka',
    ready: true,
    faqs: [
      {
        question: '¿Cómo funciona una publicación destacada en Skokka?',
        answer:
          'Tu publicación se muestra en los primeros lugares del listado. Defines cuántas veces sube al día (subidas), en qué horarios y por cuántos días. Mientras más subidas y horarios, más visibilidad.',
      },
      {
        question: '¿Qué significan las «subidas»?',
        answer:
          'Una subida es cada vez que tu publicación vuelve automáticamente a los primeros puestos durante el día. Puedes elegir 3 o 6 subidas diarias.',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Súper Top y Top All in One?',
        answer:
          'TOP aparece en los primeros lugares. Súper Top tiene más prioridad de posición. Top All in One es lo máximo: sale en Súper Top, con fondo de color y etiqueta «Novedad».',
      },
    ],
  },
  {
    slug: 'sexosur',
    path: 'guia-publicaciones-sexosur',
    name: 'Sexosur',
    title: 'Guía de publicaciones en Sexosur: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Sexosur Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Sexosur.',
    listadoImage: null,
    listadoAlt: '',
    ready: false,
    faqs: [],
  },
  {
    slug: 'locanto',
    path: 'guia-publicaciones-locanto',
    name: 'Locanto',
    title: 'Guía de publicaciones en Locanto: avisos destacados TOP y Galería',
    description:
      'Guía de publicaciones Locanto Chile: avisos destacados por 7 días, visibles 24 horas. Planes TOP, Galería o ambos, y rotación en el listado.',
    intro:
      'En Locanto los avisos destacados son por 7 días, visibles las 24 horas de cada día. Puedes elegir TOP, Galería o ambos. Tu anuncio rota dentro de su categoría: los TOP compiten entre TOP y van destacándose arriba de forma rotativa.',
    listadoImage: '/guias/locanto-listado.png',
    listadoAlt: 'Ejemplos de publicaciones TOP y Galería en el listado de Locanto',
    ready: true,
    faqs: [
      {
        question: '¿Cómo funcionan los avisos destacados en Locanto?',
        answer:
          'Los avisos destacados duran 7 días y son visibles las 24 horas de cada día. Puedes elegir el plan TOP, Galería o ambos, según la visibilidad que busques.',
      },
      {
        question: '¿Qué diferencia hay entre TOP y Galería?',
        answer:
          'TOP destaca tu anuncio arriba en el listado de su categoría. Galería muestra tu publicación en el carrusel de galería. Puedes contratar uno o combinar ambos.',
      },
      {
        question: '¿Cómo rota mi anuncio en Locanto?',
        answer:
          'Tu anuncio rota dentro de su categoría: los TOP compiten entre sí y van destacándose arriba de forma rotativa durante el período contratado.',
      },
    ],
  },
  {
    slug: 'escorcitas',
    path: 'guia-publicaciones-escorcitas',
    name: 'Escorcitas',
    title: 'Guía de publicaciones en Escorcitas: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Escorcitas Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro:
      'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Escorcitas.',
    listadoImage: null,
    listadoAlt: '',
    ready: false,
    faqs: [],
  },
  {
    slug: 'wenas',
    path: 'guia-publicaciones-wenas',
    name: 'Wenas',
    title: 'Guía de publicaciones en Wenas: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Wenas Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Wenas.',
    listadoImage: null,
    listadoAlt: '',
    ready: false,
    faqs: [],
  },
  {
    slug: 'gemidos',
    path: 'guia-publicaciones-gemidos',
    name: 'Gemidos',
    title: 'Guía de publicaciones en Gemidos: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Gemidos Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Gemidos.',
    listadoImage: null,
    listadoAlt: '',
    ready: false,
    faqs: [],
  },
]

export function anunciosGuidePath(guide: Pick<AnunciosGuide, 'path'>): string {
  return `/${guide.path}`
}

export function getAnunciosGuideByPath(pathSegment: string): AnunciosGuide | undefined {
  return ANUNCIOS_GUIDES.find((g) => g.path === pathSegment)
}

export function getAnunciosGuide(slug: string): AnunciosGuide | undefined {
  return ANUNCIOS_GUIDES.find((g) => g.slug === slug)
}

export const ANUNCIOS_GUIDE_PATHS = ANUNCIOS_GUIDES.map((g) => g.path)
