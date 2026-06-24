import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

const urlOptional = z
  .string()
  .url('Ingresa una URL válida')
  .optional()
  .or(z.literal(''))

const whatsappOptional = z
  .string()
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
    { message: 'Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)' },
  )

const latLngOptional = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || !Number.isNaN(Number(value)), { message: 'Debe ser un número' })

export const resourceSchema = z.object({
  category: z.enum([
    'delivery',
    'farmacia',
    'botilleria',
    'carniceria',
    'supermercado',
    'taxis_uber',
    'salud',
    'juridico',
    'habitaciones_escort',
    'hoteles',
    'tours_ciudad',
    'gym',
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
  latitude: latLngOptional,
  longitude: latLngOptional,
  google_maps_url: urlOptional,
  instagram_url: urlOptional,
  facebook_url: urlOptional,
  whatsapp_phone: whatsappOptional,
})

export type ResourceFormData = z.infer<typeof resourceSchema>

export const resourceCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Escribe un comentario')
    .max(2000, 'El comentario es demasiado largo'),
})

export type ResourceCommentFormData = z.infer<typeof resourceCommentSchema>

export const resourceReviewSchema = z.object({
  rating: z.number().int().min(1, 'Elige una puntuación').max(5),
  body: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
})

export type ResourceReviewFormData = z.infer<typeof resourceReviewSchema>
