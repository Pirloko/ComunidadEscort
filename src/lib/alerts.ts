import type { AlertCategory, AlertStatus } from '@/types/database'

export const ALERT_CATEGORIES: { value: AlertCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'estafa', label: 'Estafa' },
  { value: 'robo', label: 'Robo' },
  { value: 'incidente_seguridad', label: 'Incidente de seguridad' },
  { value: 'advertencia', label: 'Advertencia' },
  { value: 'otro', label: 'Otro' },
]

export const ALERT_CATEGORY_COLORS: Record<AlertCategory, string> = {
  estafa: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  robo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  incidente_seguridad: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  advertencia: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
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
