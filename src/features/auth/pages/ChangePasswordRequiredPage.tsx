import { AuthLayout } from '@/components/layout/AuthLayout'
import { ChangePasswordRequiredForm } from '@/features/auth/components/ChangePasswordRequiredForm'

export function ChangePasswordRequiredPage() {
  return (
    <AuthLayout title="Cambia tu contraseña" subtitle="Esto es obligatorio antes de continuar">
      <ChangePasswordRequiredForm />
    </AuthLayout>
  )
}
