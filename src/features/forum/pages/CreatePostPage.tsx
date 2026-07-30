import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PostForm } from '@/features/forum/components/PostForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

export function CreatePostPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { cities } = useCity()

  const cityId = profile?.city_id ?? cities[0]?.id ?? null

  if (!user) return null

  if (!cityId) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Nueva publicación</CardTitle>
            <CardDescription>
              Para publicar necesitas asociar una ciudad. Elige una en tu perfil o espera a que
              carguen las ciudades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              className="text-sm font-medium text-accent hover:underline"
              onClick={() => navigate('/profile/edit')}
            >
              Ir a editar perfil
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cityName = cities.find((c) => c.id === cityId)?.name ?? 'tu ciudad'

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nueva publicación</CardTitle>
          <CardDescription>
            Visible en el foro de toda la comunidad
            {cityName ? ` · etiquetada en ${cityName}` : ''}. Tu email nunca será visible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            cityId={cityId}
            authorId={user.id}
            onSuccess={(post) => navigate(`/forum/${post.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
