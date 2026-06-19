import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { PostForm } from '@/features/forum/components/PostForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { postService } from '@/services/post.service'

export function EditPostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedCityId } = useCity()

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPostById(postId!),
    enabled: !!postId,
  })

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl rounded-xl" />
  if (isError || !post || post.author_id !== user?.id) {
    return <ErrorState title="No puedes editar esta publicación" />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar publicación</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm
            cityId={selectedCityId!}
            authorId={user!.id}
            initialData={post}
            onSuccess={(updated) => navigate(`/forum/${updated.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
