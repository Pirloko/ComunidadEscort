/** Labels y helpers para atributos de habitaciones escort */

export const HABITACION_ATTR_LABELS = [
  { key: 'pide_reserva', label: '¿Pide reserva?' },
  { key: 'pide_referencias', label: '¿Pide referencias?' },
  { key: 'pide_doc_identidad', label: '¿Pide doc. identidad?' },
  { key: 'pide_link_publicacion', label: '¿Pide link de publicación?' },
  { key: 'acepta_parejas', label: '¿Acepta parejas?' },
  { key: 'recibe_agencias', label: '¿Recibe agencias?' },
  { key: 'tiene_camaras_seguridad', label: '¿Tiene cámaras de seguridad?' },
  { key: 'tiene_wifi', label: '¿Tiene Wifi?' },
  { key: 'tiene_bano_privado', label: '¿Tiene baño privado?' },
  { key: 'tiene_extintor', label: '¿Tiene extintor?' },
] as const

export type HabitacionAttrKey = (typeof HABITACION_ATTR_LABELS)[number]['key']

export function getRecibeALabel(
  recibeMujer: boolean,
  recibeHombre: boolean,
  recibeTrans = false,
): string {
  const parts: string[] = []
  if (recibeMujer) parts.push('Mujer')
  if (recibeHombre) parts.push('Hombre')
  if (recibeTrans) parts.push('Trans')
  if (parts.length === 0) return 'No especificado'
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} y ${parts[1]}`
  return `${parts[0]}, ${parts[1]} y ${parts[2]}`
}

export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  const base = `https://wa.me/${digits}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

export function primaryContactPhone(
  whatsapp: string | null | undefined,
  contact: string | null | undefined,
  phone: string | null | undefined,
): string | null {
  return whatsapp || contact || phone || null
}

/** Número exclusivo para WhatsApp (no usa el de llamada). */
export function habitacionWhatsappPhone(
  whatsapp: string | null | undefined,
): string | null {
  const value = whatsapp?.trim()
  return value || null
}

/** Número para llamar — solo contact_phone / phone; nunca el de WhatsApp. */
export function habitacionCallPhone(
  contact: string | null | undefined,
  phone: string | null | undefined,
): string | null {
  const value = contact?.trim() || phone?.trim()
  return value || null
}

/** Frase fija en detalle de todas las habitaciones escort. */
export const HABITACION_CONTACT_NOTICE =
  'Para mayor información ponte en contacto con el encargado para reservar o consultar valores.'

export const CONSEJOS_ARRENDADORES = [
  'Pide siempre referencias a otros dueños antes de confirmar.',
  'Explica con claridad las reglas de la casa antes de cerrar el trato.',
  'No recibas a quien haya dejado deudas en otros hospedajes.',
  'No recibas a quien haya dejado destrozos o daños en otras casas.',
  'Evita arrendamientos que lleguen desde agencias virtuales.',
  'Cobra al día: no acumules pagos pendientes; cobrar es tu responsabilidad.',
  'Entrega la habitación limpia y en buenas condiciones.',
  'Cuida y respeta a quienes cumplen: ellas vuelven y recomiendan.',
]

export const CONSEJOS_PASAJEROS = [
  'Pide referencias de la casa a tus colegas antes de viajar.',
  'Lee las reglas del hospedaje antes de confirmar o viajar.',
  'Antes de llegar, aclara todo lo que necesites saber: eso también es tu responsabilidad.',
  'No vayas a casas funadas: el flujo de clientes suele caer.',
  'No aceptes una habitación sucia o en mal estado.',
  'Sé puntual y responsable con tus pagos.',
  'Si ocurre algo irregular, documenta con tu celular (fotos o video).',
  'Si el lugar no te convence, cámbiate lo antes posible.',
  'Mantén limpia tu habitación y respeta a las demás.',
  'Cuida los hospedajes buenos: no te cierres puertas a futuro.',
]
