import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <AuthLayout title="Bienvenida de nuevo" subtitle="Ingresa a tu comunidad">
      <LoginForm />
    </AuthLayout>
  )
}
