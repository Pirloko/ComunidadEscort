import { ShieldAlert } from 'lucide-react'
import {
  CONSEJOS_ARRENDADORES,
  CONSEJOS_PASAJEROS,
} from '@/lib/habitaciones'

export function SafetyTipsSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-card/80 p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
        </span>
        <div>
          <h2 className="home-display text-[clamp(1.35rem,1.15rem+1vw,1.65rem)] font-semibold leading-tight text-foreground">
            Consejos para un arriendo seguro
          </h2>
          <p className="page-subtitle mt-2.5 leading-relaxed">
            <strong className="font-medium text-foreground">Importante:</strong> filtrar
            quién entra al inmueble es responsabilidad del dueño. Pide referencias e
            información completa antes de confirmar.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-white/8 pt-6 md:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-3 text-amber-400/90">
            Arrendadores
          </h3>
          <ul className="space-y-2.5 text-[0.9375rem] text-muted-foreground">
            {CONSEJOS_ARRENDADORES.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-3 text-amber-400/90">
            Pasajeros
          </h3>
          <ul className="space-y-2.5 text-[0.9375rem] text-muted-foreground">
            {CONSEJOS_PASAJEROS.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
