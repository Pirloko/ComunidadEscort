import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

function useMustChangePassword() {
  const { profile, isLoading } = useAuth()
  return { mustChange: profile?.must_change_password === true, isLoading }
}

/** Bloquea el resto de la app hasta que la usuaria cambie su contraseña temporal. */
export function RequirePasswordChangeDone() {
  const { mustChange, isLoading } = useMustChangePassword()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (mustChange) {
    return <Navigate to="/cambiar-password-obligatorio" replace />
  }

  return <Outlet />
}

/** Evita ver la página de cambio obligatorio si ya no hace falta. */
export function MustChangePasswordRoute() {
  const { mustChange, isLoading } = useMustChangePassword()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (!mustChange) {
    return <Navigate to="/feed" replace />
  }

  return <Outlet />
}
