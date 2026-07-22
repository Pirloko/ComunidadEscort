import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  if (!profile) {
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
          <CardDescription>Actualiza tu alias y avatar. Tu email nunca es público.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            profile={profile}
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
