import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Flag, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createReportSchema, type CreateReportFormData } from '@/features/reports/schemas/report.schema'
import { useReports } from '@/features/reports/hooks/useReports'
import { REPORT_REASONS, REPORT_TARGET_LABELS } from '@/lib/reports'
import type { ReportTargetType } from '@/types/database'

interface ReportModalProps {
  targetType: ReportTargetType
  targetId: string
  open: boolean
  onClose: () => void
}

export function ReportModal({ targetType, targetId, open, onClose }: ReportModalProps) {
  const { submitReport, isPending } = useReports()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReportFormData>({ resolver: zodResolver(createReportSchema) })

  if (!open) return null

  const handleClose = () => {
    reset()
    setError(null)
    onClose()
  }

  const onSubmit = async (data: CreateReportFormData) => {
    setError(null)
    try {
      await submitReport({
        target_type: targetType,
        target_id: targetId,
        reason: data.reason,
        details: data.details || undefined,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Flag className="h-4 w-4 text-destructive" />
            Reportar {REPORT_TARGET_LABELS[targetType].toLowerCase()}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Cuéntanos por qué este contenido infringe las normas de la comunidad. Una moderadora
            lo revisará.
          </p>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <select
              id="reason"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('reason')}
            >
              {REPORT_REASONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detalles (opcional)</Label>
            <Textarea
              id="details"
              rows={3}
              placeholder="Agrega contexto que ayude a la moderación..."
              {...register('details')}
            />
            {errors.details && (
              <p className="text-sm text-destructive">{errors.details.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar reporte
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
