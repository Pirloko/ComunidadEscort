import { Link, Navigate } from 'react-router-dom'
import { Ban, Clock, Loader2, LogOut, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canAccessCommunity } from '@/lib/account-access'

export function PendingAccountPage() {
  const { profile, isLoading, signOut, refreshProfile } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <h1 className="text-xl font-bold">No se pudo cargar tu perfil</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Tu sesión está activa, pero no encontramos el perfil vinculado a tu cuenta.
              Revisa en Supabase que el <code className="text-xs">id</code> de{' '}
              <strong>auth.users</strong> coincida con <strong>profiles.id</strong>.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="accent" onClick={() => refreshProfile()}>
                Reintentar
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (canAccessCommunity(profile)) {
    return <Navigate to="/feed" replace />
  }

  const status = profile.account_status ?? 'pendiente'

  const content = {
    pendiente: {
      icon: Clock,
      iconClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600',
      title: 'Cuenta pendiente de activación',
      message:
        'Tu solicitud fue recibida. Una administradora revisará el link de tu publicación y te contactará al número indicado en ella para activar tu cuenta.',
    },
    rechazada: {
      icon: XCircle,
      iconClass: 'bg-destructive/10 text-destructive',
      title: 'Solicitud rechazada',
      message:
        profile?.rejection_reason ??
        'Tu solicitud no fue aprobada. Si crees que es un error, contacta a la administración.',
    },
    bloqueada: {
      icon: Ban,
      iconClass: 'bg-destructive/20 text-destructive',
      title: 'Correo bloqueado',
      message:
        profile?.rejection_reason ??
        'Este correo fue bloqueado y no puede acceder a Comunidadescort.cl.',
    },
    aprobada: {
      icon: Clock,
      iconClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600',
      title: 'Cuenta pendiente',
      message: 'Tu cuenta aún no está disponible.',
    },
  }[status]

  const Icon = content.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${content.iconClass}`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">{content.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{content.message}</p>
          {profile?.alias && status === 'pendiente' && (
            <p className="mt-4 text-sm">
              Alias registrado: <strong>@{profile.alias}</strong>
            </p>
          )}
          {status === 'pendiente' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Cuando tu cuenta sea aprobada, podrás ingresar normalmente a Comunidadescort.cl.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="outline" className="w-full gap-2" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
            <Link to="/login" className="text-sm text-accent hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
