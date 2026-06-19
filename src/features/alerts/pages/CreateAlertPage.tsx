import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertForm } from '@/features/alerts/components/AlertForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

export function CreateAlertPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedCityId, selectedCity } = useCity()

  if (!user || !selectedCityId) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reportar alerta</CardTitle>
          <CardDescription>
            Tu reporte será revisado por una moderadora antes de publicarse en{' '}
            {selectedCity?.name ?? 'tu ciudad'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertForm
            cityId={selectedCityId}
            authorId={user.id}
            onSuccess={(alert) => navigate(`/alerts/${alert.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
