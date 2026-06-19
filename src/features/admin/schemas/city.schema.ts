import { z } from 'zod'

export const cityFormSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  slug: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  region_id: z.string().uuid('Selecciona una región'),
  is_active: z.boolean(),
})

export type CityFormData = z.infer<typeof cityFormSchema>
