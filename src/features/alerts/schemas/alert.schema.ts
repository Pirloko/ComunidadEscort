import { z } from 'zod'

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

export const rejectAlertSchema = z.object({
  rejection_reason: z
    .string()
    .min(5, 'Indica el motivo del rechazo')
    .max(500, 'Máximo 500 caracteres'),
})

export type CreateAlertFormData = z.infer<typeof createAlertSchema>
export type RejectAlertFormData = z.infer<typeof rejectAlertSchema>
