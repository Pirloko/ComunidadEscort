import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceForm } from '@/features/resources/components/ResourceForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

/** Alta de casa/habitación para admin (publica al tiro) o moderadora (pendiente de aprobación). */
export function CreateCasaPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { cities } = useCity()
  const isAdmin = profile?.role === 'admin'
  const defaultCityId = cities[0]?.id ?? ''

  if (!user) return null

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        to="/casas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a casas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nueva casa / habitación</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Se publica de inmediato. Puedes marcarla visible en /home.'
              : 'Quedará pendiente hasta que una administradora la apruebe. No será visible hasta entonces.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceForm
            cityId={defaultCityId}
            authorId={user.id}
            forceCategory="habitaciones_escort"
            onSuccess={() => navigate(isAdmin ? '/admin/casas' : '/casas')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
