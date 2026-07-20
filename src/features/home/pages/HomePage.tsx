import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Shield, LogIn, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { SafetyTipsSection } from '@/features/home/components/SafetyTipsSection'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canAccessCommunity } from '@/lib/account-access'
import { APP_NAME } from '@/lib/constants'
import { resourceService } from '@/services/resource.service'
import { cityService } from '@/services/city.service'

export function HomePage() {
  const { session, profile } = useAuth()
  const [search, setSearch] = useState('')
  const [cityId, setCityId] = useState('')
  const [wifi, setWifi] = useState(false)
  const [reserva, setReserva] = useState(false)
  const [parejas, setParejas] = useState(false)

  const { data: cities = [] } = useQuery({
    queryKey: ['public-cities'],
    queryFn: () => cityService.getPublicCities(),
  })

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      cityId: cityId || undefined,
      tiene_wifi: wifi || undefined,
      pide_reserva: reserva || undefined,
      acepta_parejas: parejas || undefined,
    }),
    [search, cityId, wifi, reserva, parejas],
  )

  const { data: habitaciones = [], isLoading } = useQuery({
    queryKey: ['public-habitaciones', filters],
    queryFn: () => resourceService.getPublicHabitaciones(filters),
  })

  const loggedIn = !!session
  const canEnter = profile ? canAccessCommunity(profile) : false

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/home" className="flex items-center gap-2 text-primary">
            <Shield className="h-6 w-6 text-accent" />
            <span className="font-bold">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            {loggedIn && canEnter ? (
              <Button asChild size="sm" variant="accent" className="gap-1">
                <Link to="/feed">
                  <LayoutDashboard className="h-4 w-4" />
                  Ir a la comunidad
                </Link>
              </Button>
            ) : loggedIn ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/cuenta-pendiente">Mi cuenta</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/register">Regístrate</Link>
                </Button>
                <Button asChild size="sm" variant="accent" className="gap-1">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:py-12">
        <section className="space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            Habitaciones para escort
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Encuentra hospedaje seguro
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Busca habitaciones publicadas por la administración. Contacta directo por WhatsApp
            o teléfono.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar habitaciones para escort..."
              className="h-11 pl-9"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="city">Ciudad</Label>
              <select
                id="city"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas las ciudades</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={wifi} onCheckedChange={setWifi} />
                Wifi
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={reserva} onCheckedChange={setReserva} />
                Pide reserva
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={parejas} onCheckedChange={setParejas} />
                Acepta parejas
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Resultados{!isLoading ? ` (${habitaciones.length})` : ''}
          </h2>

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          )}

          {!isLoading && habitaciones.length === 0 && (
            <EmptyState
              icon={Search}
              title="Sin habitaciones"
              description="No hay habitaciones públicas que coincidan con tu búsqueda."
            />
          )}

          {!isLoading && habitaciones.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {habitaciones.map((h) => (
                <HabitacionCard
                  key={h.id}
                  habitacion={h}
                  detailTo={`/home/habitaciones/${h.id}`}
                />
              ))}
            </div>
          )}
        </section>

        <SafetyTipsSection />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {APP_NAME} · Comunidad privada · Seguridad · Apoyo mutuo
      </footer>
    </div>
  )
}
