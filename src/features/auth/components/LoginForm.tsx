import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schema'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { canAccessCommunity } from '@/lib/account-access'
import { looksLikePhone, normalizePhoneChile } from '@/lib/phone'

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/feed'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      let user

      if (looksLikePhone(data.identifier)) {
        const phone = normalizePhoneChile(data.identifier)
        const result = await authService.signInWithPhone(phone, data.password)
        user = result.user
      } else {
        const blocked = await profileService.isEmailBlocked(data.identifier)
        if (blocked) {
          setError('Este correo está bloqueado y no puede ingresar a la comunidad.')
          return
        }
        const result = await authService.signIn(data.identifier, data.password)
        user = result.user
      }

      if (!user) throw new Error('No se pudo iniciar sesión')

      const profile = await profileService.getOwnProfile(user.id)

      if (profile.account_status === 'bloqueada') {
        await authService.signOut()
        setError('Este correo está bloqueado y no puede ingresar a la comunidad.')
        return
      }

      if (!canAccessCommunity(profile)) {
        navigate('/cuenta-pendiente', { replace: true })
        return
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">Email o celular</Label>
            <Input
              id="identifier"
              placeholder="tu@correo.com o +56 9 1234 5678"
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-accent hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Iniciar sesión
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
