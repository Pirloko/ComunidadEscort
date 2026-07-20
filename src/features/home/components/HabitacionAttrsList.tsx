import {
  HABITACION_ATTR_LABELS,
  getRecibeALabel,
} from '@/lib/habitaciones'
import type { Resource } from '@/types/resources'

interface HabitacionAttrsListProps {
  habitacion: Resource
}

export function HabitacionAttrsList({ habitacion }: HabitacionAttrsListProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="flex justify-between gap-4 border-b border-border/50 py-1.5">
        <span className="text-muted-foreground">Recibe a</span>
        <span className="font-medium">
          {getRecibeALabel(habitacion.recibe_mujer, habitacion.recibe_hombre)}
        </span>
      </div>
      {HABITACION_ATTR_LABELS.map(({ key, label }) => (
        <div
          key={key}
          className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0"
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{habitacion[key] ? 'Sí' : 'No'}</span>
        </div>
      ))}
    </div>
  )
}
