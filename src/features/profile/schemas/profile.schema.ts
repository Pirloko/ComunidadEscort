import { z } from 'zod'

export const editProfileSchema = z.object({
  alias: z
    .string()
    .min(3, 'El alias debe tener al menos 3 caracteres')
    .max(30, 'El alias no puede superar 30 caracteres')
    .regex(/^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números y guión bajo'),
  city_id: z.string().uuid('Selecciona una ciudad').optional().or(z.literal('')),
  description: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export const privacySettingsSchema = z.object({
  show_city: z.boolean(),
  show_description: z.boolean(),
  allow_messages: z.boolean(),
})

export type EditProfileFormData = z.infer<typeof editProfileSchema>
export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>
