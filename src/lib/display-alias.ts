/** Alias visible en UI (p. ej. cuenta staff se muestra como «admin»). */
export function displayAuthorAlias(alias: string): string {
  const normalized = alias.trim().toLowerCase()
  if (normalized === 'carlosadmin' || normalized === 'admin') return 'admin'
  return alias
}
