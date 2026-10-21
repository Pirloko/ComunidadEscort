import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { authService } from '@/services/auth.service'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenHash = searchParams.get('type') === 'recovery' ? searchParams.get('token_hash') : null
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!tokenHash) return
    setError(null)
    setVerifying(true)
    try {
      await authService.verifyRecoveryToken(tokenHash)
      setVerified(true)
    } catch {
      setError('Este enlace no es válido o ya expiró. Pide uno nuevo a la administración.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura">
      {tokenHash && !verified ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <p className="text-sm text-muted-foreground">
              Recibiste un enlace para restablecer tu contraseña. Pulsa continuar para elegir una
              nueva.
            </p>
            <Button className="w-full" onClick={handleContinue} disabled={verifying}>
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-accent hover:underline">
                Volver al login
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <ResetPasswordForm />
      )}
    </AuthLayout>
  )
}
