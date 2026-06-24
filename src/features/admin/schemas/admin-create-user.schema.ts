import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

export const adminCreateUserSchema = z.object({
  alias: z
    .string()
    .min(3, 'El alias debe tener al menos 3 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres')
    .regex(/^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números y guión bajo'),
  email: z.string().email('Ingresa un correo válido'),
  phone: z.string().refine(
    (value) => {
      try {
        normalizePhoneChile(value)
        return true
      } catch {
        return false
      }
    },
    { message: 'Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)' },
  ),
  publication_link: z
    .string()
    .trim()
    .min(10, 'Ingresa el enlace completo de la publicación')
    .url('Ingresa un enlace válido (debe comenzar con http:// o https://)'),
  city_id: z.string().optional(),
})

export type AdminCreateUserFormData = z.infer<typeof adminCreateUserSchema>
