import { AuthLayout } from '@/components/layout/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export function RegisterPage() {
  return (
    <AuthLayout title="Únete a la comunidad" subtitle="Crea tu perfil anónimo y seguro">
      <RegisterForm />
    </AuthLayout>
  )
}
