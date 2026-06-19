import { z } from 'zod'

export const createReportSchema = z.object({
  reason: z.enum(['spam', 'contenido_inapropiado', 'acoso', 'informacion_falsa', 'otro']),
  details: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export type CreateReportFormData = z.infer<typeof createReportSchema>
