import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PostForm } from '@/features/forum/components/PostForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'

export function CreatePostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedCityId, selectedCity } = useCity()

  if (!user || !selectedCityId) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nueva publicación</CardTitle>
          <CardDescription>
            Publicarás en {selectedCity?.name ?? 'tu ciudad'}. Tu email nunca será visible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            cityId={selectedCityId}
            authorId={user.id}
            onSuccess={(post) => navigate(`/forum/${post.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
