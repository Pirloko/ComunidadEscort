import type { ReportReason, ReportTargetType } from '@/types/database'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam o publicidad' },
  { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
  { value: 'acoso', label: 'Acoso o lenguaje ofensivo' },
  { value: 'informacion_falsa', label: 'Información falsa' },
  { value: 'otro', label: 'Otro' },
]

export function getReportReasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason
}

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  post: 'Publicación',
  comment: 'Comentario',
  alert: 'Alerta',
}
