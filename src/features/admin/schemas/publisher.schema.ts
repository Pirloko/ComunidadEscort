import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

export const publisherFormSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  whatsapp: z.string().refine(
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
  note: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  is_active: z.boolean(),
  sort_order: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0'),
})

export type PublisherFormData = z.infer<typeof publisherFormSchema>
