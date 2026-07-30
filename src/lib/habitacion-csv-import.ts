import { normalizePhoneChile } from '@/lib/phone'
import type { CreateResourceInput } from '@/types/resources'

export type HabitacionCsvCity = { id: string; name: string }

export type ParsedHabitacionCsvRow = CreateResourceInput & {
  /** Número de fila en el archivo (1-based, con encabezado). */
  rowNumber: number
}

export type HabitacionCsvParseError = {
  row: number
  message: string
}

export type HabitacionCsvParseResult = {
  rows: ParsedHabitacionCsvRow[]
  errors: HabitacionCsvParseError[]
}

const BOOL_KEYS = [
  'visible_en_home',
  'recibe_mujer',
  'recibe_hombre',
  'recibe_trans',
  'pide_reserva',
  'pide_referencias',
  'pide_doc_identidad',
  'pide_link_publicacion',
  'acepta_parejas',
  'recibe_agencias',
  'tiene_camaras_seguridad',
  'tiene_wifi',
  'tiene_bano_privado',
  'tiene_extintor',
] as const

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function normalizeCityName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function detectDelimiter(headerLine: string): ';' | ',' {
  const semis = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  return semis >= commas ? ';' : ','
}

/** Parseo simple CSV con comillas dobles y delimitador ; o , */
function splitCsvLine(line: string, delimiter: ';' | ','): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function parseBool(value: string | undefined, defaultValue = false): boolean {
  if (value == null || value.trim() === '') return defaultValue
  const v = value.trim().toLowerCase()
  if (['si', 'sí', 'yes', 'true', '1', 's'].includes(v)) return true
  if (['no', 'false', '0', 'n'].includes(v)) return false
  throw new Error(`Valor booleano inválido "${value}" (usa si/no)`)
}

function optionalPhone(value: string | undefined): string | null {
  const raw = value?.trim()
  if (!raw) return null
  return normalizePhoneChile(raw)
}

/**
 * Parsea la plantilla docs/plantilla-import-casas.csv
 * (también acepta una línea de título antes del encabezado).
 */
export function parseHabitacionesCsv(
  text: string,
  cities: HabitacionCsvCity[],
): HabitacionCsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'El archivo está vacío' }] }
  }

  const headerIdx = lines.findIndex((line) => {
    const n = normalizeHeader(line.split(/[;,]/)[0] ?? '')
    return n === 'ciudad'
  })
  if (headerIdx === -1) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: 'No se encontró la fila de encabezados (debe empezar con "ciudad")',
        },
      ],
    }
  }

  const delimiter = detectDelimiter(lines[headerIdx]!)
  const headers = splitCsvLine(lines[headerIdx]!, delimiter).map(normalizeHeader)
  const cityByName = new Map(cities.map((c) => [normalizeCityName(c.name), c]))

  const rows: ParsedHabitacionCsvRow[] = []
  const errors: HabitacionCsvParseError[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const rowNumber = i + 1
    const cells = splitCsvLine(lines[i]!, delimiter)
    const get = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 ? (cells[idx] ?? '').trim() : ''
    }

    try {
      const cityName = get('ciudad')
      const name = get('nombre')
      if (!cityName && !name) continue

      if (!cityName) throw new Error('Falta ciudad')
      if (!name || name.length < 2) throw new Error('Falta nombre (mín. 2 caracteres)')

      const city = cityByName.get(normalizeCityName(cityName))
      if (!city) throw new Error(`Ciudad no encontrada: "${cityName}"`)

      const whatsapp = optionalPhone(get('whatsapp'))
      const contact = optionalPhone(get('telefono_llamada'))

      const bools: Record<(typeof BOOL_KEYS)[number], boolean> = {
        visible_en_home: true,
        recibe_mujer: true,
        recibe_hombre: false,
        recibe_trans: false,
        pide_reserva: false,
        pide_referencias: false,
        pide_doc_identidad: false,
        pide_link_publicacion: false,
        acepta_parejas: false,
        recibe_agencias: false,
        tiene_camaras_seguridad: false,
        tiene_wifi: false,
        tiene_bano_privado: false,
        tiene_extintor: false,
      }

      for (const key of BOOL_KEYS) {
        const raw = get(key)
        if (raw) bools[key] = parseBool(raw, bools[key])
      }

      rows.push({
        rowNumber,
        city_id: city.id,
        category: 'habitaciones_escort',
        name,
        description: get('descripcion') || null,
        address: get('direccion') || null,
        whatsapp_phone: whatsapp,
        contact_phone: contact,
        phone: null,
        is_public: bools.visible_en_home,
        house_rules: get('reglas') || null,
        recibe_mujer: bools.recibe_mujer,
        recibe_hombre: bools.recibe_hombre,
        recibe_trans: bools.recibe_trans,
        pide_reserva: bools.pide_reserva,
        pide_referencias: bools.pide_referencias,
        pide_doc_identidad: bools.pide_doc_identidad,
        pide_link_publicacion: bools.pide_link_publicacion,
        acepta_parejas: bools.acepta_parejas,
        recibe_agencias: bools.recibe_agencias,
        tiene_camaras_seguridad: bools.tiene_camaras_seguridad,
        tiene_wifi: bools.tiene_wifi,
        tiene_bano_privado: bools.tiene_bano_privado,
        tiene_extintor: bools.tiene_extintor,
      })
    } catch (err) {
      errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : 'Fila inválida',
      })
    }
  }

  return { rows, errors }
}
