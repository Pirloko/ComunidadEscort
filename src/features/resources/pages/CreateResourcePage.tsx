import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceForm } from '@/features/resources/components/ResourceForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

export function CreateResourcePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedCityId, selectedCity } = useCity()

  if (!user || !selectedCityId) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Agregar recurso</CardTitle>
          <CardDescription>
            Tu recomendación será revisada por una moderadora antes de publicarse en el
            directorio de {selectedCity?.name ?? 'tu ciudad'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceForm
            cityId={selectedCityId}
            authorId={user.id}
            onSuccess={() => navigate('/resources/mine')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
