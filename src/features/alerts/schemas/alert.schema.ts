import { z } from 'zod'

const funarCategoryEnum = z.enum([
  'estafa',
  'robo',
  'incidente_seguridad',
  'advertencia',
  'acoso',
  'violencia',
  'no_pago',
  'cliente_peligroso',
  'otro',
])

export const createAlertSchema = z.object({
  category: z.enum(['estafa', 'robo', 'incidente_seguridad', 'advertencia', 'otro']),
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción es demasiado larga'),
  location_detail: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
})

export const funarClienteSchema = z
  .object({
    category: funarCategoryEnum,
    category_other: z.string().max(120).optional().or(z.literal('')),
    title: z
      .string()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(200, 'El título no puede superar 200 caracteres'),
    client_number: z
      .string()
      .min(5, 'Indica el número del cliente')
      .max(40, 'Máximo 40 caracteres'),
    description: z
      .string()
      .min(10, 'Describe qué fue lo que pasó')
      .max(5000, 'La descripción es demasiado larga'),
    city_mode: z.enum(['list', 'other']),
    city_id: z.string().uuid().optional().or(z.literal('')),
    city_other: z.string().max(120).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.category === 'otro' && !data.category_other?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indica cuál es el otro tipo',
        path: ['category_other'],
      })
    }
    if (data.city_mode === 'list' && !data.city_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona una ciudad',
        path: ['city_id'],
      })
    }
    if (data.city_mode === 'other' && !data.city_other?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escribe la ciudad o comuna',
        path: ['city_other'],
      })
    }
  })

export const recomendarClienteSchema = z
  .object({
    client_number: z
      .string()
      .min(5, 'Indica el número del cliente')
      .max(40, 'Máximo 40 caracteres'),
    rating: z.number().int().min(0).max(5),
    treatment_notes: z
      .string()
      .min(5, 'Cuéntanos cómo fue el trato')
      .max(2000, 'Máximo 2000 caracteres'),
    hygiene_notes: z
      .string()
      .min(5, 'Cuéntanos sobre la higiene')
      .max(2000, 'Máximo 2000 caracteres'),
    city_mode: z.enum(['list', 'other']),
    city_id: z.string().uuid().optional().or(z.literal('')),
    city_other: z.string().max(120).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.city_mode === 'list' && !data.city_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona una ciudad',
        path: ['city_id'],
      })
    }
    if (data.city_mode === 'other' && !data.city_other?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escribe la ciudad o comuna',
        path: ['city_other'],
      })
    }
  })

export const rejectAlertSchema = z.object({
  rejection_reason: z
    .string()
    .min(5, 'Indica el motivo del rechazo')
    .max(500, 'Máximo 500 caracteres'),
})

export type CreateAlertFormData = z.infer<typeof createAlertSchema>
export type FunarClienteFormData = z.infer<typeof funarClienteSchema>
export type RecomendarClienteFormData = z.infer<typeof recomendarClienteSchema>
export type RejectAlertFormData = z.infer<typeof rejectAlertSchema>
