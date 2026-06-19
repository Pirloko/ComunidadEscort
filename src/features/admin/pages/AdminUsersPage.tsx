import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserRow } from '@/features/admin/components/UserRow'
import { profileService } from '@/services/profile.service'
import { cn } from '@/lib/utils'

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const onlyPending = searchParams.get('pending') === '1'
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search, onlyPending],
    queryFn: () =>
      profileService.listProfiles({
        search: search || undefined,
        onlyPending,
        limit: 100,
      }),
  })

  const setPendingFilter = (pending: boolean) => {
    if (pending) {
      setSearchParams({ pending: '1' })
    } else {
      setSearchParams({})
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">
          Usuarios ({users.length})
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={onlyPending ? 'default' : 'outline'}
            onClick={() => setPendingFilter(true)}
          >
            Pendientes de aprobación
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!onlyPending ? 'default' : 'outline'}
            onClick={() => setPendingFilter(false)}
          >
            Todos
          </Button>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por alias o email..."
          className="max-w-md"
        />
      </CardHeader>
      <CardContent className={cn('p-0', onlyPending && 'border-t border-amber-200/50')}>
        {isLoading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <EmptyState
            icon={Users}
            title={onlyPending ? 'Sin cuentas pendientes' : 'Sin usuarios'}
            description={
              onlyPending
                ? 'No hay solicitudes de registro esperando aprobación.'
                : 'No hay usuarios que coincidan con la búsqueda.'
            }
          />
        )}

        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </CardContent>
    </Card>
  )
}
