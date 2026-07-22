import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { InstallPwaBanner } from '@/components/shared/InstallPwaBanner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PrivacySettingsForm } from '@/features/profile/components/PrivacySettingsForm'

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth()

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="page-title">Configuración</h1>
        <p className="text-muted-foreground">Administra tu privacidad y preferencias.</p>
      </div>

      <InstallPwaBanner />

      <Card>
        <CardHeader>
          <CardTitle>Privacidad</CardTitle>
          <CardDescription>Controla qué información ven otros miembros de la comunidad.</CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacySettingsForm profile={profile} onSuccess={() => refreshProfile()} />
        </CardContent>
      </Card>
    </div>
  )
}
