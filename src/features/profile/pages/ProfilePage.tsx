import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Home, UserX } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HabitacionCard } from '@/features/home/components/HabitacionCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { bookmarkService } from '@/services/bookmark.service'
import { profileService } from '@/services/profile.service'
import { resourceService } from '@/services/resource.service'
import { postService } from '@/services/post.service'
import { PostCard } from '@/features/forum/components/PostCard'
import '@/features/home/home-landing.css'

export function ProfilePage() {
  const { alias } = useParams<{ alias: string }>()
  const { profile: ownProfile, user } = useAuth()
  const isOwnProfile = ownProfile?.alias.toLowerCase() === alias?.toLowerCase()

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile', alias],
    queryFn: () => profileService.getProfileByAlias(alias!),
    enabled: !!alias,
  })

  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: () => postService.getPostsByAuthor(profile!.id),
    enabled: !!profile?.id,
  })

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['bookmarks-habitaciones', user?.id],
    queryFn: () => bookmarkService.getBookmarkedHabitacionIds(user!.id),
    enabled: isOwnProfile && !!user?.id,
  })

  const { data: favoriteCasas = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['bookmarks-habitaciones', user?.id, 'items', favoriteIds],
    queryFn: () => resourceService.getHabitacionesByIds(favoriteIds),
    enabled: isOwnProfile && favoriteIds.length > 0,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />
  }

  if (!profile) {
    return (
      <EmptyState
        icon={UserX}
        title="Perfil no encontrado"
        description="Este usuario no existe o no está disponible."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/members">
              <Button variant="accent">Ver miembros</Button>
            </Link>
            <Link to="/feed">
              <Button variant="outline">Volver al feed</Button>
            </Link>
          </div>
        }
      />
    )
  }

  const showDescription = profile.privacy_settings.show_description && profile.description
  const memberSince = new Date(profile.created_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-4">
      <Card>
        <CardContent className="pt-8">
          <div className="flex flex-col items-center text-center">
            <Avatar src={profile.avatar_url} alias={profile.alias} size="xl" />
            <h1 className="page-title mt-4">@{profile.alias}</h1>

            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Miembro desde {memberSince}
            </div>

            {showDescription && (
              <p className="mt-4 max-w-md text-muted-foreground">{profile.description}</p>
            )}

            {!showDescription && !isOwnProfile && (
              <p className="mt-4 text-sm italic text-muted-foreground">
                La descripción de este perfil no es pública.
              </p>
            )}

            {isOwnProfile && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/profile/edit">
                  <Button variant="outline">Editar perfil</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost">Configuración</Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isOwnProfile && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Casas favoritas
            </h2>
            {favoriteCasas.length > 0 && (
              <Link to="/casas" className="text-sm font-medium text-accent hover:underline">
                Ver todas
              </Link>
            )}
          </div>

          {loadingFavorites && favoriteIds.length > 0 && (
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          )}

          {!loadingFavorites && favoriteCasas.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <p>Aún no tienes casas guardadas.</p>
                <Link to="/casas" className="mt-2 inline-block font-medium text-accent hover:underline">
                  Explorar habitaciones
                </Link>
              </CardContent>
            </Card>
          )}

          {favoriteCasas.length > 0 && (
            <ul className="space-y-4">
              {favoriteCasas.map((h) => (
                <li key={h.id}>
                  <HabitacionCard
                    habitacion={h}
                    detailTo={`/casas/${h.id}`}
                    showFavorite
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {userPosts.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">Publicaciones</h2>
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      )}
    </div>
  )
}
