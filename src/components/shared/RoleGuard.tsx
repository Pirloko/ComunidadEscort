import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'

interface RoleGuardProps {
  children: React.ReactNode
  roles: UserRole[]
  fallback?: string
}

export function RoleGuard({ children, roles, fallback = '/feed' }: RoleGuardProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
