import type { ReactNode } from 'react'

interface DeviceGateProps {
  children: ReactNode
}

/**
 * Antes bloqueaba PC/tablet para no-admin (solo smartphone).
 * Se desactivó para no perjudicar la indexación en Google:
 * el bot suele rastrear como escritorio y debe ver el mismo contenido que un usuario.
 */
export function DeviceGate({ children }: DeviceGateProps) {
  return children
}
