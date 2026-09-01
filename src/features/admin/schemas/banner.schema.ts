import { z } from 'zod'

export const bannerFormSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120, 'Máximo 120 caracteres'),
  link_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), {
      message: 'Debe ser una URL válida (http o https)',
    }),
  is_active: z.boolean(),
  sort_order: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0'),
})

export type BannerFormData = z.infer<typeof bannerFormSchema>
