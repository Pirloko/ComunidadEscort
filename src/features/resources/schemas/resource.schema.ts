import { z } from 'zod'

const urlOptional = z
  .string()
  .url('Ingresa una URL válida')
  .optional()
  .or(z.literal(''))

export const resourceSchema = z.object({
  category: z.enum([
    'delivery',
    'farmacias',
    'supermercados',
    'transporte',
    'salud',
    'juridico',
    'hospedaje',
    'otros',
  ]),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  website: urlOptional,
})

export type ResourceFormData = z.infer<typeof resourceSchema>
