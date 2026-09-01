import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageIcon, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { BannerRow } from '@/features/admin/components/BannerRow'
import { BannerForm } from '@/features/admin/components/BannerForm'
import { bannerService } from '@/services/banner.service'
import type { HomeBanner } from '@/types/admin'

export function AdminBannersPage() {
  const [editing, setEditing] = useState<HomeBanner | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => bannerService.listAll(),
  })

  const showForm = showCreate || editing

  return (
    <div className="space-y-4">
      {showForm && (
        <BannerForm
          banner={editing}
          onClose={() => {
            setEditing(null)
            setShowCreate(false)
          }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Banners del home ({banners.length})</CardTitle>
          {!showForm && (
            <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nuevo banner
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!isLoading && banners.length === 0 && (
            <EmptyState
              icon={ImageIcon}
              title="Sin banners"
              description="Crea el primero para mostrarlo en el carrusel superior del home."
            />
          )}

          {banners.map((banner) => (
            <BannerRow
              key={banner.id}
              banner={banner}
              onEdit={(b) => {
                setShowCreate(false)
                setEditing(b)
              }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
