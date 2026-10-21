import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, KeyRound, Link2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { profileService } from '@/services/profile.service'
import type { AdminPasswordResetMode, AdminProfile } from '@/types/admin'

interface ResetPasswordHelpModalProps {
  user: AdminProfile
  onClose: () => void
}

export function ResetPasswordHelpModal({ user, onClose }: ResetPasswordHelpModalProps) {
  const [copied, setCopied] = useState(false)

  const resetMutation = useMutation({
    mutationFn: (mode: AdminPasswordResetMode) => profileService.resetPasswordAsAdmin(user.id, mode),
  })

  const result = resetMutation.data
  const resetLink =
    result && 'tokenHash' in result
      ? `${window.location.origin}/reset-password?token_hash=${encodeURIComponent(result.tokenHash)}&type=recovery`
      : null
  const temporaryPassword = result && 'temporaryPassword' in result ? result.temporaryPassword : null

  const handleCopy = async () => {
    if (resetLink) {
      await navigator.clipboard.writeText(resetLink)
    } else if (temporaryPassword && result) {
      await navigator.clipboard.writeText(
        `Email: ${result.email}\nContraseña temporal: ${temporaryPassword}`,
      )
    }
    setCopied(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Restablecer clave de @{user.alias}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {resetLink
                  ? 'Envía este enlace solo al celular registrado de la usuaria. Sirve una sola vez y expira en aproximadamente 1 hora.'
                  : 'Copia ahora la contraseña temporal — no se volverá a mostrar. Al iniciar sesión se le pedirá elegir una nueva.'}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="rounded-md border bg-muted px-3 py-2 text-sm">{result.email}</p>
              </div>
              {resetLink ? (
                <div className="space-y-1">
                  <Label>Enlace para restablecer</Label>
                  <p className="break-all rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                    {resetLink}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Contraseña temporal</Label>
                  <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                    {temporaryPassword}
                  </p>
                </div>
              )}
              <Button type="button" className="w-full gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : resetLink ? 'Copiar enlace' : 'Copiar credenciales'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {resetMutation.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {resetMutation.error instanceof Error
                    ? resetMutation.error.message
                    : 'Error al restablecer la contraseña'}
                </div>
              )}

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Enlace de un solo uso (recomendado)</p>
                <p className="text-xs text-muted-foreground">
                  La usuaria elige su nueva clave desde el enlace. Nadie más llega a conocerla.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  disabled={resetMutation.isPending}
                  onClick={() => resetMutation.mutate('link')}
                >
                  {resetMutation.isPending && resetMutation.variables === 'link' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Generar enlace
                </Button>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Contraseña temporal</p>
                <p className="text-xs text-muted-foreground">
                  Reemplaza su clave actual de inmediato. Al entrar deberá cambiarla obligatoriamente.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={resetMutation.isPending}
                  onClick={() => resetMutation.mutate('temporary')}
                >
                  {resetMutation.isPending && resetMutation.variables === 'temporary' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Generar contraseña temporal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
