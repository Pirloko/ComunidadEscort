import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas/auth.schema'
import { authService } from '@/services/auth.service'

export function ChangePasswordRequiredForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null)
    try {
      await authService.completeForcedPasswordChange(data.password)
      navigate('/feed', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Tu cuenta fue creada por una administradora con una contraseña temporal. Antes de
          continuar, debes elegir una contraseña propia.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
