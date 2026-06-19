import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas/auth.schema'
import { authService } from '@/services/auth.service'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    try {
      await authService.resetPassword(data.email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo')
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <h2 className="text-lg font-semibold">Correo enviado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login">
            <Button className="mt-6 w-full" variant="outline">
              Volver al login
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
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar enlace de recuperación
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-accent hover:underline">
              Volver al login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
