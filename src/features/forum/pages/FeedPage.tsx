import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldAlert,
  MessageSquare,
  Users,
  Bookmark,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CityBadge } from '@/components/shared/CityBadge'
import { PostCard } from '@/features/forum/components/PostCard'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { postService } from '@/services/post.service'
import { alertService } from '@/services/alert.service'
import { resourceService } from '@/services/resource.service'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { useBookmarks } from '@/features/bookmarks/hooks/useBookmarks'

export function FeedPage() {
  const { profile, user } = useAuth()
  const { selectedCity, selectedCityId } = useCity()

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', selectedCityId, 'feed'],
    queryFn: async () => {
      const raw = await postService.getPosts({ cityId: selectedCityId!, limit: 3 })
      return user ? postService.enrichWithLikes(raw, user.id) : raw
    },
    enabled: !!selectedCityId,
  })

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', selectedCityId, 'feed'],
    queryFn: () => alertService.getApprovedAlerts({ cityId: selectedCityId!, limit: 3 }),
    enabled: !!selectedCityId,
  })

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', selectedCityId, 'feed'],
    queryFn: () => resourceService.getResources({ cityId: selectedCityId!, limit: 4 }),
    enabled: !!selectedCityId,
  })

  const { count: bookmarkCount } = useBookmarks()

  const { data: alertCount = 0 } = useQuery({
    queryKey: ['alerts-count', selectedCityId],
    queryFn: () => alertService.getApprovedCount(selectedCityId!),
    enabled: !!selectedCityId,
  })

  const stats = [
    { label: 'Alertas activas', value: String(alertCount), icon: ShieldAlert, color: 'text-destructive' },
    { label: 'Publicaciones nuevas', value: postsLoading ? '...' : String(posts.length), icon: MessageSquare, color: 'text-accent' },
    { label: 'Miembros conectadas', value: '—', icon: Users, color: 'text-success', soon: true },
    { label: 'Guardados', value: String(bookmarkCount), icon: Bookmark, color: 'text-primary' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hola, {profile?.alias} 👋</h1>
          <p className="text-muted-foreground">
            Bienvenida a tu comunidad segura
            {selectedCity ? ` en ${selectedCity.name}` : ''}.
          </p>
        </div>
        {selectedCity && <CityBadge cityName={selectedCity.name} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, soon }) => {
          const card = (
            <Card key={label} className={label === 'Guardados' ? 'transition-shadow hover:shadow-md' : undefined}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-xl bg-muted p-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">
                    {label}
                    {soon && ' (pronto)'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
          return label === 'Guardados' ? (
            <Link key={label} to="/bookmarks">
              {card}
            </Link>
          ) : (
            card
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Alertas recientes</h2>
              <Link to="/alerts" className="flex items-center gap-1 text-sm text-accent hover:underline">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {alertsLoading && <Skeleton className="h-36 rounded-xl" />}

            {!alertsLoading && alerts.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No hay alertas verificadas en esta ciudad.
                  <Link to="/alerts/new" className="mt-2 block text-destructive hover:underline">
                    Reportar una alerta
                  </Link>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publicaciones recientes</h2>
              <Link to="/forum" className="flex items-center gap-1 text-sm text-accent hover:underline">
                Ver foro <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {postsLoading && (
              <>
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
              </>
            )}

            {!postsLoading && posts.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 font-medium">Aún no hay publicaciones</p>
                  <Link to="/forum/new">
                    <Button variant="accent" className="mt-4">Nueva publicación</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {posts.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))}
          </section>
        </div>

        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">¿Viste algo sospechoso?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reporta estafas, robos o situaciones de riesgo. Tu alerta será verificada antes de publicarse.
              </p>
              <Link to="/alerts/new">
                <Button variant="destructive" size="sm" className="mt-3 w-full">
                  Reportar alerta
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recursos recomendados</CardTitle>
                <Link to="/resources" className="text-xs text-accent hover:underline">
                  Ver todos
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {resourcesLoading && <Skeleton className="h-20 w-full" />}
              {!resourcesLoading && resources.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aún no hay recursos en esta ciudad.
                </p>
              )}
              {resources.slice(0, 3).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
              <Link to="/resources/new">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  Agregar recurso <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
