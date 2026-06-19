import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AccountStatusBadge } from '@/features/admin/components/AccountStatusBadge'
import { rejectAlertSchema, type RejectAlertFormData } from '@/features/alerts/schemas/alert.schema'
import { formatRelativeTime } from '@/lib/format'
import { profileService } from '@/services/profile.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AdminProfile } from '@/types/admin'

interface UserReviewModalProps {
  user: AdminProfile | null
  mode: 'reject' | 'block' | null
  onClose: () => void
}

function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  queryClient.invalidateQueries({ queryKey: ['admin-pending-users-count'] })
}

export function UserReviewModal({ user, mode, onClose }: UserReviewModalProps) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAlertFormData>({ resolver: zodResolver(rejectAlertSchema) })

  useEffect(() => {
    if (user && mode) reset()
  }, [user, mode, reset])

  const reviewMutation = useMutation({
    mutationFn: (data: RejectAlertFormData) =>
      profileService.reviewAccount(user!.id, currentUser!.id, {
        account_status: mode === 'block' ? 'bloqueada' : 'rechazada',
        rejection_reason: data.rejection_reason,
      }),
    onSuccess: () => {
      invalidateUserQueries(queryClient)
      onClose()
    },
  })

  if (!user || !mode) return null

  const isBlock = mode === 'block'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">
            {isBlock ? 'Bloquear correo' : 'Rechazar solicitud'}
          </h2>
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
          <div className="flex flex-wrap items-center gap-2">
            <AccountStatusBadge status={user.account_status} />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(user.created_at)}
            </span>
          </div>
          <p className="mt-2 font-semibold">@{user.alias}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.publication_link && (
            <p className="mt-2 truncate text-sm text-accent">{user.publication_link}</p>
          )}

          <form
            onSubmit={handleSubmit((data) => reviewMutation.mutate(data))}
            className="mt-5 space-y-3"
          >
            <Label htmlFor="rejection_reason">
              {isBlock ? 'Motivo del bloqueo' : 'Motivo del rechazo'}
            </Label>
            <Textarea
              id="rejection_reason"
              rows={3}
              placeholder={
                isBlock
                  ? 'Este correo no podrá registrarse ni ingresar...'
                  : 'Explica por qué no se aprueba la cuenta...'
              }
              {...register('rejection_reason')}
            />
            {errors.rejection_reason && (
              <p className="text-sm text-destructive">{errors.rejection_reason.message}</p>
            )}
            {isBlock && (
              <p className="text-xs text-muted-foreground">
                El correo quedará bloqueado permanentemente para nuevos registros e ingresos.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={reviewMutation.isPending}
                className="gap-1"
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                {isBlock ? 'Confirmar bloqueo' : 'Confirmar rechazo'}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface UserApproveButtonProps {
  user: AdminProfile
  disabled?: boolean
}

export function UserApproveButton({ user, disabled }: UserApproveButtonProps) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: () =>
      profileService.reviewAccount(user.id, currentUser!.id, { account_status: 'aprobada' }),
    onSuccess: () => invalidateUserQueries(queryClient),
  })

  return (
    <Button
      size="sm"
      className="gap-1 bg-success hover:bg-success/90"
      disabled={disabled || approveMutation.isPending}
      onClick={() => approveMutation.mutate()}
    >
      {approveMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Aprobar
    </Button>
  )
}
