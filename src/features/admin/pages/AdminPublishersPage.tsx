import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { PublisherRow } from '@/features/admin/components/PublisherRow'
import { PublisherForm } from '@/features/admin/components/PublisherForm'
import { publisherService } from '@/services/publisher.service'
import type { RecommendedPublisher } from '@/types/admin'

export function AdminPublishersPage() {
  const [editing, setEditing] = useState<RecommendedPublisher | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: publishers = [], isLoading } = useQuery({
    queryKey: ['admin-publishers'],
    queryFn: () => publisherService.listAll(),
  })

  const showForm = showCreate || editing

  return (
    <div className="space-y-4">
      {showForm && (
        <PublisherForm
          publisher={editing}
          onClose={() => {
            setEditing(null)
            setShowCreate(false)
          }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Publicadores recomendados ({publishers.length})
          </CardTitle>
          {!showForm && (
            <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Nuevo publicador
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!isLoading && publishers.length === 0 && (
            <EmptyState
              icon={MessageCircle}
              title="Sin publicadores"
              description="Crea el primero para mostrarlo en el home bajo Guía de publicaciones."
            />
          )}

          {publishers.map((publisher) => (
            <PublisherRow
              key={publisher.id}
              publisher={publisher}
              onEdit={(p) => {
                setShowCreate(false)
                setEditing(p)
              }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
