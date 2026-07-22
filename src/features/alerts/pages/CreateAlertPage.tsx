import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldAlert, ThumbsUp, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FunarClienteForm } from '@/features/alerts/components/FunarClienteForm'
import { RecomendarClienteForm } from '@/features/alerts/components/RecomendarClienteForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'

type Mode = 'choose' | 'funar' | 'recomendar'

export function CreateAlertPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const modeParam = params.get('modo')
  const mode: Mode =
    modeParam === 'funar' || modeParam === 'recomendar' ? modeParam : 'choose'

  if (!user) return null

  const setMode = (next: Mode) => {
    if (next === 'choose') setParams({})
    else setParams({ modo: next })
  }

  if (mode === 'choose') {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Funar o recomendar cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige qué quieres hacer. Ambos reportes pasan por revisión antes de publicarse.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setMode('funar')}
            className={cn(
              'flex items-center gap-4 rounded-2xl border border-destructive/25 bg-gradient-to-br from-destructive/10 via-card to-card p-4 text-left',
              'transition-opacity active:opacity-90',
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Funar</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reportar un mal cliente, riesgo o situación de alerta
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('recomendar')}
            className={cn(
              'flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 text-left',
              'transition-opacity active:opacity-90',
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <ThumbsUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Recomendar</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dejar una reseña positiva sobre trato e higiene
              </p>
            </div>
          </button>
        </div>

        <Link to="/alerts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a reportes
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button
        type="button"
        onClick={() => setMode('choose')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Elegir de nuevo
      </button>

      <Card>
        <CardHeader>
          <CardTitle>{mode === 'funar' ? 'Funar cliente' : 'Recomendar cliente'}</CardTitle>
          <CardDescription>
            {mode === 'funar'
              ? 'Tu funa será revisada por una moderadora antes de publicarse.'
              : 'Tu recomendación será revisada antes de publicarse.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'funar' ? (
            <FunarClienteForm
              authorId={user.id}
              onSuccess={(alert) => navigate(`/alerts/${alert.id}`)}
            />
          ) : (
            <RecomendarClienteForm
              authorId={user.id}
              onSuccess={(alert) => navigate(`/alerts/${alert.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
