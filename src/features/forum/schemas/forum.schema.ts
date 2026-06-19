import { z } from 'zod'

export const createPostSchema = z.object({
  category: z.enum([
    'seguridad',
    'consejos',
    'salud',
    'bienestar',
    'transporte',
    'recursos_utiles',
    'conversaciones_generales',
  ]),
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),
  content: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(10000, 'El contenido es demasiado largo'),
})

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Escribe un comentario')
    .max(5000, 'El comentario es demasiado largo'),
})

export type CreatePostFormData = z.infer<typeof createPostSchema>
export type CommentFormData = z.infer<typeof commentSchema>
