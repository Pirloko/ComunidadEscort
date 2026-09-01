import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  email: z.string().trim().email('Email no válido'),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => {
        if (!value) return true
        try {
          normalizePhoneChile(value)
          return true
        } catch {
          return false
        }
      },
      { message: 'Celular Chile inválido (ej: +56 9 1234 5678)' },
    ),
  subject: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  message: z
    .string()
    .trim()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
