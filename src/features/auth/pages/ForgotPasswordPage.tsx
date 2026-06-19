import { AuthLayout } from '@/components/layout/AuthLayout'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
