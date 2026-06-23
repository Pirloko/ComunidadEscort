import { Link, Navigate } from 'react-router-dom'
import { Ban, CheckCircle2, Clock, Loader2, LogOut, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApprovalTimeline } from '@/features/auth/components/ApprovalTimeline'
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
      message: 'Tu solicitud fue recibida y está en revisión.',
    },
    rechazada: {
      icon: XCircle,
      iconClass: 'bg-destructive/10 text-destructive',
      title: 'Solicitud rechazada',
      message: 'Tu solicitud de registro no fue aprobada.',
    },
    bloqueada: {
      icon: Ban,
      iconClass: 'bg-destructive/20 text-destructive',
      title: 'Acceso bloqueado',
      message: 'Este correo fue bloqueado y no puede acceder a Comunidadescort.cl.',
    },
    aprobada: {
      icon: CheckCircle2,
      iconClass: 'bg-success/10 text-success',
      title: 'Cuenta aprobada',
      message: 'Ya puedes ingresar a la comunidad.',
    },
  }[status]

  const Icon = content.icon
  const showReasonBox = status === 'rechazada' || status === 'bloqueada'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
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

          <div className="mt-8 rounded-lg border bg-muted/30 p-5 text-left">
            <ApprovalTimeline status={status} publicationLink={profile.publication_link} />
          </div>

          {showReasonBox && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
              <p className="text-sm font-medium text-destructive">Motivo</p>
              <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                {profile?.rejection_reason ??
                  'No se especificó un motivo. Si crees que es un error, contacta a la administración.'}
              </p>
            </div>
          )}

          {status === 'pendiente' && (
            <p className="mt-4 text-xs text-muted-foreground">
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
