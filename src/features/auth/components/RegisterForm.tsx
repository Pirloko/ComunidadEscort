import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schema'
import { authService, cityService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { normalizePhoneChile } from '@/lib/phone'

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      const blocked = await profileService.isEmailBlocked(data.email)
      if (blocked) {
        setError('Este correo está bloqueado y no puede registrarse en la comunidad.')
        return
      }

      const available = await cityService.isAliasAvailable(data.alias)
      if (!available) {
        setError('Este alias ya está en uso. Elige otro.')
        return
      }

      await authService.signUp(
        data.email,
        data.password,
        data.alias,
        normalizePhoneChile(data.phone),
        data.publication_link,
      )
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h2 className="text-lg font-semibold">Solicitud enviada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa tu correo para confirmar tu cuenta. Luego, una administradora verificará el link
            de tu publicación y te contactará al número indicado para activar tu acceso.
          </p>
          <Link to="/login">
            <Button className="mt-6 w-full" variant="accent">
              Ir a iniciar sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alias">Alias (público, anónimo)</Label>
            <Input id="alias" placeholder="tu_alias" {...register('alias')} />
            {errors.alias && <p className="text-sm text-destructive">{errors.alias.message}</p>}
            <p className="text-xs text-muted-foreground">Tu email nunca será visible públicamente.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Celular</Label>
            <Input id="phone" type="tel" placeholder="+56 9 1234 5678" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publication_link">Link de publicación</Label>
            <Input
              id="publication_link"
              type="url"
              placeholder="https://..."
              {...register('publication_link')}
            />
            {errors.publication_link && (
              <p className="text-sm text-destructive">{errors.publication_link.message}</p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Aquí debes pegar el link de tu publicación. Puede ser de cualquier página (Chimbis,
              Skokka, Sexosur.cl, Escorcitas.cl, Wenas.cl, Gemidos, etc.). Al número de la
              publicación serás contactada para activar tu cuenta.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres, con al menos 1 mayúscula y 1 número o símbolo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" variant="accent" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
