import { AuthLayout } from '@/components/layout/AuthLayout'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export function ResetPasswordPage() {
  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura">
      <ResetPasswordForm />
    </AuthLayout>
  )
}
