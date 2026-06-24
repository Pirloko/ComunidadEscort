import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { ResourceForm } from '@/features/resources/components/ResourceForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'

export function EditResourcePage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { selectedCityId } = useCity()

  const { data: resource, isLoading, isError } = useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => resourceService.getResourceById(resourceId!),
    enabled: !!resourceId,
  })

  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl rounded-xl" />
  if (isError || !resource || !isMod) {
    return <ErrorState title="No puedes editar este dato" />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar dato</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm
            cityId={selectedCityId!}
            authorId={user!.id}
            initialData={resource}
            onSuccess={(updated) => navigate(`/resources/${updated.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
