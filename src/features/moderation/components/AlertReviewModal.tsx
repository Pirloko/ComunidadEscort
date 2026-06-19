import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCategoryBadge } from '@/features/alerts/components/AlertCategoryBadge'
import { rejectAlertSchema, type RejectAlertFormData } from '@/features/alerts/schemas/alert.schema'
import { formatRelativeTime } from '@/lib/format'
import { alertService } from '@/services/alert.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Alert } from '@/types/alerts'

interface AlertReviewModalProps {
  alert: Alert | null
  onClose: () => void
}

function invalidateAlertQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['pending-alerts'] })
  queryClient.invalidateQueries({ queryKey: ['pending-alerts-count'] })
  queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
  queryClient.invalidateQueries({ queryKey: ['alerts'] })
}

export function AlertReviewModal({ alert, onClose }: AlertReviewModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showReject, setShowReject] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAlertFormData>({ resolver: zodResolver(rejectAlertSchema) })

  useEffect(() => {
    if (alert) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowReject(false)
      reset()
    }
  }, [alert, reset])

  const approveMutation = useMutation({
    mutationFn: () =>
      alertService.reviewAlert(alert!.id, user!.id, { status: 'aprobada' }),
    onSuccess: () => {
      invalidateAlertQueries(queryClient)
      onClose()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (data: RejectAlertFormData) =>
      alertService.reviewAlert(alert!.id, user!.id, {
        status: 'rechazada',
        rejection_reason: data.rejection_reason,
      }),
    onSuccess: () => {
      invalidateAlertQueries(queryClient)
      onClose()
    },
  })

  if (!alert) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Revisar alerta</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <AlertCategoryBadge category={alert.category} />
            <span className="text-xs text-muted-foreground">
              {alert.city?.name} · {formatRelativeTime(alert.created_at)}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold">{alert.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {alert.description}
          </p>
          {alert.location_detail && (
            <p className="mt-2 text-xs text-muted-foreground">📍 {alert.location_detail}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Por @{alert.author?.alias ?? 'anónima'}
          </p>

          {!showReject ? (
            <div className="mt-5 flex gap-2">
              <Button
                className="flex-1 gap-1 bg-success hover:bg-success/90"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aprobar
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1 text-destructive"
                onClick={() => setShowReject(true)}
              >
                <X className="h-4 w-4" />
                Rechazar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((data) => rejectMutation.mutate(data))}
              className="mt-5 space-y-3 rounded-lg border p-4"
            >
              <Label htmlFor="rejection_reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection_reason"
                rows={3}
                placeholder="Explica por qué no se publicará..."
                {...register('rejection_reason')}
              />
              {errors.rejection_reason && (
                <p className="text-sm text-destructive">{errors.rejection_reason.message}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectMutation.isPending}
                >
                  Confirmar rechazo
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowReject(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
