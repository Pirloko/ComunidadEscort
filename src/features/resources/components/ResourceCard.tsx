import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ResourceCategoryBadge } from '@/features/resources/components/ResourceCategoryBadge'
import { AlertStatusBadge } from '@/features/alerts/components/AlertStatusBadge'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { truncateText } from '@/lib/format'
import type { Resource } from '@/types/resources'

interface ResourceCardProps {
  resource: Resource
  showStatus?: boolean
}

export function ResourceCard({ resource, showStatus = false }: ResourceCardProps) {
  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10">
        <BookmarkButton itemType="resource" itemId={resource.id} size="sm" />
      </div>
      <Link to={`/resources/${resource.id}`}>
        <CardContent className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <ResourceCategoryBadge category={resource.category} />
            {showStatus && <AlertStatusBadge status={resource.status} />}
            {!showStatus && resource.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verificado
              </span>
            )}
          </div>

          <h3 className="mt-3 font-semibold leading-snug">{resource.name}</h3>

          {resource.description && (
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground line-clamp-2">
              {truncateText(resource.description, 100)}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            {resource.city && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {resource.city.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-medium text-accent">
              Ver detalle
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
