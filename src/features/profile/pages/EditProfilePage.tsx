import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm'
import { cityService } from '@/services/city.service'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const { cities: contextCities } = useCity()

  const { data: cities = contextCities, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => cityService.getPublicCities(),
    initialData: contextCities,
  })

  if (!profile || isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Editar perfil</CardTitle>
          <CardDescription>Actualiza tu alias, ciudad y avatar. Tu email nunca es público.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            profile={profile}
            cities={cities}
            onSuccess={async (updated) => {
              await refreshProfile()
              navigate(`/profile/${updated.alias}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
