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
  /** URL oficial del portal (botón “conoce la página”) */
  siteUrl: string
  /** Título SEO / H1 */
  title: string
  description: string
  /** Resumen corto bajo el título */
  intro: string
  /** Capturas “así se ven en el listado”; vacío = aún sin material */
  listadoImages: { src: string; alt: string }[]
  faqs: AnunciosGuideFaq[]
  /** false = chip visible pero página “próximamente” */
  ready: boolean
}

export const ANUNCIOS_GUIDES: AnunciosGuide[] = [
  {
    slug: 'chimbis',
    path: 'guia-publicaciones-chimbis',
    name: 'Chimbis',
    siteUrl: 'https://chimbis.cl',
    title: 'Guía de publicaciones en Chimbis: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Chimbis Chile: cómo funcionan los avisos destacados TOP, Destacado, Historias, subidas y cómo se ven en el listado.',
    intro:
      'Chimbis es un portal de publicaciones y avisos destacados en Chile. La visibilidad de cada publicación depende del plan que elijas: zona, días, subidas y combos TOP / Destacado / Historias.',
    listadoImages: [
      {
        src: '/guias/chimbis-listado.png',
        alt: 'Ejemplos de publicaciones TOP, Destacado e Historias en el listado de Chimbis',
      },
    ],
    ready: true,
    faqs: [
      {
        question: '¿Qué significan las «subidas» en Chimbis?',
        answer:
          'Cada subida es una vez que tu aviso vuelve a los primeros puestos del listado durante el período contratado. Puedes elegir distintas cantidades según la zona y los días.',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Destacado e Historias?',
        answer:
          'TOP te lleva a los primeros lugares. Destacado agrega mayor visibilidad en el listado. Historias incluye publicación en historias. Puedes combinarlos según el plan que definas.',
      },
      {
        question: '¿Puedo subir fotos y videos?',
        answer:
          'Sí. En Chimbis solo se aceptan avisos destacados con fotos 100% reales y comprobables. También puedes subir videos.',
      },
      {
        question: '¿Los precios son distintos en Santiago y en otras ciudades?',
        answer:
          'Sí. Santiago/RM y las demás ciudades del norte o sur tienen tablas de precios diferentes. El cotizador te muestra el valor exacto según lo que marques.',
      },
    ],
  },
  {
    slug: 'skokka',
    path: 'guia-publicaciones-skokka',
    name: 'Skokka',
    siteUrl: 'https://cl.skokka.com',
    title: 'Guía de publicaciones en Skokka: cómo funcionan los avisos destacados para Escort',
    description:
      'Guía de publicaciones Skokka Chile: cómo funcionan los avisos destacados TOP, Súper Top, Top All in One, subidas y cómo se ven en el listado.',
    intro:
      'En Skokka las publicaciones destacadas compiten por los primeros lugares del listado. El plan (TOP, Súper Top o Top All in One) y las subidas diarias definen cuánta visibilidad tiene tu aviso.',
    listadoImages: [
      {
        src: '/guias/skokka-listado.png',
        alt: 'Ejemplos de publicaciones TOP, Súper Top y Top All in One en el listado de Skokka',
      },
    ],
    ready: true,
    faqs: [
      {
        question: '¿Qué significan las «subidas» en Skokka?',
        answer:
          'Cada subida es una vez que tu aviso vuelve automáticamente a los primeros puestos del listado. En Chile puedes elegir 3 o 6 subidas diarias; el sistema reparte esos horarios dentro de la franja que marques (mañana, tarde, noche o madrugada).',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Súper Top y Top All in One?',
        answer:
          'TOP te lleva a los primeros lugares, con foto de vista previa y etiqueta Top. Súper Top suma más prioridad visual en el listado. Top All in One es lo máximo: combina Súper Top, resaltado de color y etiqueta «Novedad».',
      },
      {
        question: '¿Puedo elegir días y horarios?',
        answer:
          'Sí. Puedes contratar 1, 3 o 7 días y definir en qué período del día quieres las subidas. Si la franja ya empezó al momento de comprar, la primera subida queda programada para el día siguiente.',
      },
      {
        question: '¿Puedo subir fotos?',
        answer:
          'Sí. Con TOP se muestra una imagen de vista previa junto al título en el listado durante toda la promoción, y dentro del aviso puedes incluir hasta 10 fotos.',
      },
    ],
  },
  {
    slug: 'sexosur',
    path: 'guia-publicaciones-sexosur',
    name: 'Sexosur',
    siteUrl: 'https://sexosur.cl',
    title: 'Guía de publicaciones en Sexosur: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Sexosur Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Sexosur.',
    listadoImages: [],
    ready: false,
    faqs: [],
  },
  {
    slug: 'locanto',
    path: 'guia-publicaciones-locanto',
    name: 'Locanto',
    siteUrl: 'https://www.locanto.cl',
    title: 'Guía de publicaciones en Locanto: avisos destacados TOP y Galería',
    description:
      'Guía de publicaciones Locanto Chile (locanto.cl): avisos destacados por 7 días, rotación TOP y Galería, precios y cómo se ven en el listado.',
    intro:
      'En Locanto (locanto.cl) los avisos destacados duran 7 días y están visibles las 24 horas. Puedes elegir TOP, Galería o TOP + Galería; cada plan rota dentro de su categoría.',
    listadoImages: [
      {
        src: '/guias/locanto-listado.png',
        alt: 'Ejemplos de publicaciones TOP y Galería en el listado de Locanto',
      },
    ],
    ready: true,
    faqs: [
      {
        question: '¿Cuántos días dura un aviso destacado en Locanto?',
        answer:
          'Los avisos destacados en Locanto son por 7 días. Durante ese período tu anuncio está visible las 24 horas de cada día.',
      },
      {
        question: '¿Cómo funciona la rotación en Locanto?',
        answer:
          'Los anuncios se mueven dentro de su propia categoría. Los TOP rotan entre los TOP: periódicamente uno sube arriba y van turnándose. Lo mismo ocurre en Galería. Tu aviso sigue visible todo el día.',
      },
      {
        question: '¿Qué diferencia hay entre TOP, Galería y TOP + Galería?',
        answer:
          'TOP te ubica en la categoría TOP. Galería en la categoría Galería. TOP + Galería es una sola publicación que aparece en ambas categorías.',
      },
      {
        question: '¿Cuánto cuesta destacar en Locanto?',
        answer:
          'TOP 7 días: $17.500. Galería 7 días: $16.000. TOP + Galería: $30.000. El cotizador te muestra el precio al tiro.',
      },
    ],
  },
  {
    slug: 'simpleescorts',
    path: 'guia-publicaciones-simpleescorts',
    name: 'SimpleEscorts',
    siteUrl: 'https://cl.simpleescorts.com',
    title:
      'Guía de publicaciones en SimpleEscorts: cómo funciona Super Turbo para Escort',
    description:
      'Guía de publicaciones SimpleEscorts Chile: Super Turbo, subidas por franja horaria, ventajas visuales, horarios y precios.',
    intro:
      'En SimpleEscorts el plan más visible es Super Turbo: foto más grande, etiqueta propia, color distintivo y subidas automáticas en las franjas horarias que contrates.',
    listadoImages: [
      {
        src: '/guias/simpleescorts-listado.png',
        alt: 'Ejemplo de publicación Super Turbo en el listado de SimpleEscorts',
      },
    ],
    ready: true,
    faqs: [
      {
        question: '¿Qué es Super Turbo en SimpleEscorts?',
        answer:
          'Es el plan más visible de SimpleEscorts. Tu aviso lleva foto 2,5 veces más grande, etiqueta Super Turbo y un color distintivo que lo separa del resto. Además sube 5 veces en cada franja horaria que contrates, volviendo a los primeros lugares del listado.',
      },
      {
        question: '¿Qué significa que sube 5 veces?',
        answer:
          'En cada horario que definas, tu aviso vuelve automáticamente a los primeros puestos 5 veces al día. Con los 4 horarios son 20 subidas diarias en total.',
      },
      {
        question: '¿Qué ventajas visuales tiene el Super Turbo?',
        answer:
          'Foto 2,5 veces más grande que un aviso normal, etiqueta Super Turbo sobre la imagen y un color diferente que hace que tu anuncio destaque en el listado.',
      },
      {
        question: '¿Cuáles son los horarios?',
        answer:
          'Mañana (06:00–12:00), Tarde (12:00–18:00), Noche (18:00–00:00) y Madrugada (00:00–06:00). Puedes marcar uno o más, o los 4 con precio full.',
      },
      {
        question: '¿Cuánto cuesta?',
        answer:
          'Depende de los días (1, 3, 5 o 7) y si marcas full horarios o por franja.',
      },
    ],
  },
  {
    slug: 'escorcitas',
    path: 'guia-publicaciones-escorcitas',
    name: 'Escorcitas',
    siteUrl: 'https://escorcitas.cl',
    title:
      'Guía de publicaciones en Escorcitas: cómo funcionan TOP, PREMIUM y GOLD',
    description:
      'Guía de publicaciones Escorcitas Chile: diferencia entre TOP, PREMIUM y GOLD, rotación de anuncios y cómo se ven en el listado.',
    intro:
      'En Escorcitas la visibilidad depende del plan: TOP, PREMIUM o GOLD. Cada uno tiene distinta etiqueta, cantidad de fotos/videos y rotación dentro de su propia categoría.',
    listadoImages: [
      {
        src: '/guias/escorcitas-top.png',
        alt: 'Publicación TOP en el listado de Escorcitas',
      },
      {
        src: '/guias/escorcitas-premium.png',
        alt: 'Publicación PREMIUM en el listado de Escorcitas',
      },
      {
        src: '/guias/escorcitas-gold.png',
        alt: 'Publicación GOLD en el listado de Escorcitas',
      },
    ],
    ready: true,
    faqs: [
      {
        question: '¿Qué diferencia hay entre TOP, PREMIUM y GOLD?',
        answer:
          'TOP lleva etiqueta verde y hasta 8 fotos. PREMIUM se destaca en azul, permite 2 fotos de perfil, hasta 10 fotos y 1 video opcional. GOLD es el más grande: 3 fotos de portada, hasta 12 fotos, videos, clave de acceso y estados/historias.',
      },
      {
        question: '¿Cómo rotan los anuncios?',
        answer:
          'Cada anuncio rota dentro de su propia categoría (TOP, PREMIUM o GOLD). Periódicamente uno sube arriba y van turnándose entre los del mismo plan.',
      },
    ],
  },
  {
    slug: 'wenas',
    path: 'guia-publicaciones-wenas',
    name: 'Wenas',
    siteUrl: 'https://www.wenas.cl',
    title: 'Guía de publicaciones en Wenas: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Wenas Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Wenas.',
    listadoImages: [],
    ready: false,
    faqs: [],
  },
  {
    slug: 'gemidos',
    path: 'guia-publicaciones-gemidos',
    name: 'Gemidos',
    siteUrl: 'https://gemidos.tv',
    title: 'Guía de publicaciones en Gemidos: cómo funcionan los avisos para escort',
    description:
      'Guía de publicaciones Gemidos Chile. Cómo funcionan los avisos destacados — contenido en preparación.',
    intro: 'Pronto publicaremos cómo funcionan las publicaciones y avisos destacados en Gemidos.',
    listadoImages: [],
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
