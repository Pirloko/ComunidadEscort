import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z
  .object({
    alias: z
      .string()
      .min(3, 'El alias debe tener al menos 3 caracteres')
      .max(30, 'El alias no puede superar 30 caracteres')
      .regex(/^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números y guión bajo'),
    email: z.string().email('Ingresa un correo válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    city_id: z.string().uuid('Selecciona una ciudad'),
    publication_link: z
      .string()
      .trim()
      .min(10, 'Ingresa el enlace completo de tu publicación')
      .url('Ingresa un enlace válido (debe comenzar con http:// o https://)'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
