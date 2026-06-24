import type { ResourceCategory } from '@/types/database'

export const RESOURCE_CATEGORIES: { value: ResourceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'delivery', label: 'Delivery de comida' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'botilleria', label: 'Botillería' },
  { value: 'carniceria', label: 'Carnicería' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'taxis_uber', label: 'Taxis o Uber' },
  { value: 'salud', label: 'Servicios de salud' },
  { value: 'juridico', label: 'Servicios jurídicos' },
  { value: 'habitaciones_escort', label: 'Habitaciones para escort' },
  { value: 'hoteles', label: 'Hoteles' },
  { value: 'tours_ciudad', label: 'Tours en la ciudad' },
  { value: 'gym', label: 'Gym' },
  { value: 'otros', label: 'Otros' },
]

export const RESOURCE_CATEGORY_COLORS: Record<ResourceCategory, string> = {
  delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  farmacia: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  botilleria: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  carniceria: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  supermercado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  taxis_uber: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  salud: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  juridico: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  habitaciones_escort: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  hoteles: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  tours_ciudad: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  gym: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  otros: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export function getResourceCategoryLabel(category: ResourceCategory): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === category)?.label ?? category
}
