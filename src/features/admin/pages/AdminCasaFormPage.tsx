import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { ResourceForm } from '@/features/resources/components/ResourceForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'

export function AdminCasaFormPage() {
  const { casaId } = useParams<{ casaId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cities } = useCity()
  const isEdit = Boolean(casaId)

  const { data: resource, isLoading, isError } = useQuery({
    queryKey: ['resource', casaId],
    queryFn: () => resourceService.getResourceById(casaId!),
    enabled: isEdit && !!casaId,
  })

  if (!user) return null

  if (isEdit && isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (isEdit && (isError || !resource || resource.category !== 'habitaciones_escort')) {
    return <ErrorState title="Casa no encontrada" />
  }

  const defaultCityId = resource?.city_id ?? cities[0]?.id ?? ''

  return (
    <div className="space-y-4">
      <Link
        to="/admin/casas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a casas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Editar casa / habitación' : 'Nueva casa / habitación'}</CardTitle>
          <CardDescription>
            Solo administradoras. Puedes pausarla o publicarla en /home desde el listado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceForm
            cityId={defaultCityId}
            authorId={user.id}
            initialData={resource ?? undefined}
            forceCategory="habitaciones_escort"
            onSuccess={() => navigate('/admin/casas')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
