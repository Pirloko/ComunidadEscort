import type { PostCategory } from '@/types/database'

export const POST_CATEGORIES: {
  value: PostCategory | 'all'
  label: string
  icon: string
}[] = [
  { value: 'all', label: 'Todas', icon: '📋' },
  { value: 'seguridad', label: 'Seguridad', icon: '🛡️' },
  { value: 'consejos', label: 'Consejos', icon: '💡' },
  { value: 'conversaciones_generales', label: 'Experiencias', icon: '💬' },
  { value: 'salud', label: 'Salud', icon: '❤️' },
  { value: 'bienestar', label: 'Bienestar', icon: '🌿' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'recursos_utiles', label: 'Recursos útiles', icon: '📚' },
]

export const CATEGORY_COLORS: Record<PostCategory, string> = {
  seguridad: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  consejos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  salud: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  bienestar: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  transporte: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  recursos_utiles: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  conversaciones_generales: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export function getCategoryLabel(category: PostCategory): string {
  return POST_CATEGORIES.find((c) => c.value === category)?.label ?? category
}
