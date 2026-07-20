import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceForm } from '@/features/resources/components/ResourceForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

export function CreateResourcePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedCityId } = useCity()

  if (!user || !selectedCityId) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Agregar dato</CardTitle>
          <CardDescription>
            Elige la ciudad del dato al publicarlo. Las{' '}
            <strong>habitaciones para escort</strong> solo las crea una administradora (con
            fotos y visibilidad en /home).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceForm
            cityId={selectedCityId}
            authorId={user.id}
            onSuccess={(resource) => navigate(`/resources/${resource.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
