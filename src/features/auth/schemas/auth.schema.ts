import { z } from 'zod'
import { normalizePhoneChile } from '@/lib/phone'

export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9!@#$%^&*().,\-_=+]/, 'Debe incluir al menos un número o un símbolo')

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Ingresa tu correo o celular'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export const registerSchema = z
  .object({
    alias: z
      .string()
      .min(3, 'El alias debe tener al menos 3 caracteres')
      .max(30, 'El alias no puede superar 30 caracteres')
      .regex(/^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números y guión bajo'),
    email: z.string().email('Ingresa un correo válido'),
    phone: z.string().refine(
      (value) => {
        try {
          normalizePhoneChile(value)
          return true
        } catch {
          return false
        }
      },
      { message: 'Debe ser celular Chile: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678)' },
    ),
    password: passwordSchema,
    confirmPassword: z.string(),
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
    password: passwordSchema,
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
