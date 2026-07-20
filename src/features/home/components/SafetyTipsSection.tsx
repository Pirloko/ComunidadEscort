import {
  CONSEJOS_ARRENDADORES,
  CONSEJOS_PASAJEROS,
} from '@/lib/habitaciones'

export function SafetyTipsSection() {
  return (
    <section className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-amber-500">
          Consejos para un Arriendo Seguro
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong className="text-foreground">IMPORTANTE:</strong> es responsabilidad del dueño
          del hospedaje filtrar a quienes entran a su inmueble. Asegúrate de pedir toda la
          información necesaria.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-500/90">
            Arrendadores
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {CONSEJOS_ARRENDADORES.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-500/90">
            Pasajeros
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {CONSEJOS_PASAJEROS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
