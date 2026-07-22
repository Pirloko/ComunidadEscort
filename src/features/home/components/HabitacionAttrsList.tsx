import {
  HABITACION_ATTR_LABELS,
  getRecibeALabel,
} from '@/lib/habitaciones'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types/resources'

interface HabitacionAttrsListProps {
  habitacion: Resource
  className?: string
}

function AttrBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[2.75rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        value ? 'habitacion-attr-badge-yes' : 'habitacion-attr-badge-no',
      )}
    >
      {value ? 'Sí' : 'No'}
    </span>
  )
}

export function HabitacionAttrsList({ habitacion, className }: HabitacionAttrsListProps) {
  return (
    <div className={cn('habitacion-attrs-panel space-y-1 rounded-2xl p-4 text-sm', className)}>
      <p className="habitacion-section-label mb-3">Detalles del hospedaje</p>

      <div className="habitacion-attr-row flex items-center justify-between gap-4 rounded-lg px-2 py-2.5">
        <span className="text-muted-foreground">Recibe a</span>
        <span className="text-right font-semibold text-foreground">
          {getRecibeALabel(
            habitacion.recibe_mujer,
            habitacion.recibe_hombre,
            habitacion.recibe_trans,
          )}
        </span>
      </div>

      {HABITACION_ATTR_LABELS.map(({ key, label }) => (
        <div
          key={key}
          className="habitacion-attr-row flex items-center justify-between gap-4 rounded-lg px-2 py-2.5"
        >
          <span className="text-muted-foreground">{label}</span>
          <AttrBadge value={habitacion[key]} />
        </div>
      ))}
    </div>
  )
}
