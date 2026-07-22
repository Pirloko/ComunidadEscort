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
  { key: 'tiene_kit_primeros_auxilios', label: '¿Tiene kit de primeros auxilios?' },
  { key: 'tiene_extintor', label: '¿Tiene extintor?' },
] as const

export type HabitacionAttrKey = (typeof HABITACION_ATTR_LABELS)[number]['key']

export function getRecibeALabel(recibeMujer: boolean, recibeHombre: boolean): string {
  if (recibeMujer && recibeHombre) return 'Mujer y Hombre'
  if (recibeMujer) return 'Mujer'
  if (recibeHombre) return 'Hombre'
  return 'No especificado'
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

export const CONSEJOS_ARRENDADORES = [
  'No aceptes personas que han dejado deudas en otros hospedajes.',
  'No aceptes personas que han dejado destrozos en otros hospedajes.',
  'Asegúrate de pedir referencias con otros dueños.',
  'No acumules pagos pendientes (cobrar es tu responsabilidad).',
  'No aceptes personas que vengan de agencias virtuales.',
  'Deja claras tus reglas y normas de la casa antes de arrendar.',
  'Cuida y respeta a quienes cumplen; ellas volverán.',
  'Entrega la habitación completamente limpia.',
]

export const CONSEJOS_PASAJEROS = [
  'No vayas a casas funadas: no te llegarán clientes.',
  'No aceptes que te entreguen una habitación sucia.',
  'Pide referencias de la casa a tus colegas.',
  'Antes de llegar, pide toda la información necesaria (esa es tu responsabilidad).',
  'Antes de viajar, lee las reglas de la casa.',
  'Sé puntual y responsable en tus pagos.',
  'Tu celular tiene cámara: puedes registrar cualquier anormalidad.',
  'Si no te gusta el lugar que elegiste, cámbiate lo antes posible.',
  'Cuida la limpieza del lugar y respeta a los demás.',
  'Cuida los hospedajes: no te cierres las puertas.',
]
