import type { AlertCategory, AlertStatus } from '@/types/database'

export const ALERT_CATEGORIES: { value: AlertCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'estafa', label: 'Estafa' },
  { value: 'robo', label: 'Robo' },
  { value: 'incidente_seguridad', label: 'Incidente de seguridad' },
  { value: 'advertencia', label: 'Advertencia' },
  { value: 'acoso', label: 'Acoso' },
  { value: 'violencia', label: 'Violencia' },
  { value: 'no_pago', label: 'No pago / intento de estafa' },
  { value: 'cliente_peligroso', label: 'Cliente peligroso' },
  { value: 'recomendacion', label: 'Recomendación' },
  { value: 'otro', label: 'Otro' },
]

/** Categorías disponibles al funar (sin recomendación) */
export const FUNAR_CATEGORIES = ALERT_CATEGORIES.filter(
  (c) => c.value !== 'all' && c.value !== 'recomendacion',
)

export const ALERT_CATEGORY_COLORS: Record<AlertCategory, string> = {
  estafa: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  robo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  incidente_seguridad: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  advertencia: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  acoso: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  violencia: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
  no_pago: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  cliente_peligroso: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  recomendacion: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  otro: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  pendiente: 'Pendiente de revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  aprobada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rechazada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function getAlertCategoryLabel(category: AlertCategory): string {
  return ALERT_CATEGORIES.find((c) => c.value === category)?.label ?? category
}
