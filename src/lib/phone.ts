const CHILE_MOBILE_REGEX = /^\+569\d{8}$/

/**
 * Normaliza variantes de celular chileno (+56 9 1234 5678, 912345678,
 * 56912345678, con espacios/guiones) al formato canónico +569XXXXXXXX.
 */
export function normalizePhoneChile(input: string): string {
  const digits = input.replace(/[^\d]/g, '')

  let normalized: string
  if (digits.length === 8) {
    normalized = `9${digits}`
  } else {
    normalized = digits
  }
  normalized = normalized.replace(/^56/, '')
  normalized = `+56${normalized}`

  if (!CHILE_MOBILE_REGEX.test(normalized)) {
    throw new Error('Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)')
  }

  return normalized
}

export function looksLikePhone(input: string): boolean {
  if (input.includes('@')) return false
  try {
    normalizePhoneChile(input)
    return true
  } catch {
    return false
  }
}
