import { cn } from '@/lib/utils'
import type { AccountStatus } from '@/types/admin'

const STATUS_CONFIG: Record<AccountStatus, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  },
  aprobada: {
    label: 'Aprobada',
    className: 'bg-success/10 text-success',
  },
  rechazada: {
    label: 'Rechazada',
    className: 'bg-destructive/10 text-destructive',
  },
  bloqueada: {
    label: 'Email bloqueado',
    className: 'bg-destructive/20 text-destructive',
  },
}

interface AccountStatusBadgeProps {
  status: AccountStatus
  className?: string
}

export function AccountStatusBadge({ status, className }: AccountStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
