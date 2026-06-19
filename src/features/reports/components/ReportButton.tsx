import { useState, type MouseEvent } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportModal } from '@/features/reports/components/ReportModal'
import { useReports } from '@/features/reports/hooks/useReports'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { ReportTargetType } from '@/types/database'

interface ReportButtonProps {
  targetType: ReportTargetType
  targetId: string
  size?: 'sm' | 'md'
  className?: string
}

export function ReportButton({ targetType, targetId, size = 'sm', className }: ReportButtonProps) {
  const { user } = useAuth()
  const { hasReported } = useReports()
  const [open, setOpen] = useState(false)
  const reported = hasReported(targetType, targetId)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={cn(
          'gap-1.5 text-muted-foreground hover:text-destructive',
          reported && 'text-destructive',
          className,
        )}
        onClick={handleClick}
        disabled={!user || reported}
        aria-label={reported ? 'Ya reportado' : 'Reportar'}
        title={reported ? 'Ya reportado' : 'Reportar'}
      >
        <Flag className={cn('h-4 w-4', reported && 'fill-current')} />
      </Button>
      <ReportModal
        targetType={targetType}
        targetId={targetId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
