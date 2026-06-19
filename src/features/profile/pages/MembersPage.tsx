import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { CityBadge } from '@/components/shared/CityBadge'
import { MemberCard } from '@/features/profile/components/MemberCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { profileService } from '@/services/profile.service'

export function MembersPage() {
  const { user } = useAuth()
  const { selectedCity, selectedCityId } = useCity()
  const [search, setSearch] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', selectedCityId, search, user?.id],
    queryFn: () =>
      profileService.getMembersByCity(selectedCityId!, {
        excludeUserId: user?.id,
        search: search || undefined,
        limit: 50,
      }),
    enabled: !!selectedCityId,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Miembros</h1>
          <p className="text-muted-foreground">
            Conoce y escribe a otras personas de la comunidad
            {selectedCity ? ` en ${selectedCity.name}` : ''}.
          </p>
        </div>
        {selectedCity && <CityBadge cityName={selectedCity.name} />}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por alias..."
        className="max-w-md"
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && members.length === 0 && (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description={
            search
              ? 'No hay miembros con ese alias en esta ciudad.'
              : 'Aún no hay otras miembros registradas en esta ciudad.'
          }
        />
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            cityName={selectedCity?.name}
          />
        ))}
      </div>
    </div>
  )
}
