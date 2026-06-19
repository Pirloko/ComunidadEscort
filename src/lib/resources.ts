import type { ResourceCategory } from '@/types/database'

export const RESOURCE_CATEGORIES: { value: ResourceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'delivery', label: 'Delivery de comida' },
  { value: 'farmacias', label: 'Farmacias' },
  { value: 'supermercados', label: 'Supermercados' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'salud', label: 'Servicios de salud' },
  { value: 'juridico', label: 'Servicios jurídicos' },
  { value: 'hospedaje', label: 'Hospedaje' },
  { value: 'otros', label: 'Otros' },
]

export const RESOURCE_CATEGORY_COLORS: Record<ResourceCategory, string> = {
  delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  farmacias: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  supermercados: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  transporte: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  salud: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  juridico: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  hospedaje: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  otros: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export function getResourceCategoryLabel(category: ResourceCategory): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === category)?.label ?? category
}
