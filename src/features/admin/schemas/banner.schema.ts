import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

export const bannerFormSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120, 'Máximo 120 caracteres'),
  link_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), {
      message: 'Debe ser una URL válida (http o https)',
    }),
  instagram_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), {
      message: 'Debe ser una URL válida (http o https)',
    }),
  whatsapp_phone: z
    .string()
    .trim()
    .optional()
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
      { message: 'Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)' },
    ),
  is_active: z.boolean(),
  sort_order: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0'),
})

export type BannerFormData = z.infer<typeof bannerFormSchema>
