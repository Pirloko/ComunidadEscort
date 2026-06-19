import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { canAccessCommunity } from '@/lib/account-access'

export function ActiveAccountRoute() {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (!canAccessCommunity(profile)) {
    return <Navigate to="/cuenta-pendiente" replace />
  }

  return <Outlet />
}

export function PendingAccountRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (canAccessCommunity(profile)) {
    return <Navigate to="/feed" replace />
  }

  return <>{children}</>
}
