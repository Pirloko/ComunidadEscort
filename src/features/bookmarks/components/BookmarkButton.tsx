import type { MouseEvent } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookmarks } from '@/features/bookmarks/hooks/useBookmarks'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { BookmarkType } from '@/types/database'

interface BookmarkButtonProps {
  itemType: BookmarkType
  itemId: string
  size?: 'sm' | 'md'
  className?: string
  showLabel?: boolean
  onClick?: (e: MouseEvent) => void
}

export function BookmarkButton({
  itemType,
  itemId,
  size = 'md',
  className,
  showLabel = false,
  onClick,
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const { isBookmarked, toggle, isPending } = useBookmarks()
  const saved = isBookmarked(itemType, itemId)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.(e)
    toggle(itemType, itemId)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn(
        'gap-1.5 text-muted-foreground hover:text-accent',
        saved && 'text-accent',
        className,
      )}
      onClick={handleClick}
      disabled={!user || isPending}
      aria-label={saved ? 'Quitar de guardados' : 'Guardar'}
      title={saved ? 'Quitar de guardados' : 'Guardar'}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
      {showLabel && <span className="text-sm">{saved ? 'Guardado' : 'Guardar'}</span>}
    </Button>
  )
}
