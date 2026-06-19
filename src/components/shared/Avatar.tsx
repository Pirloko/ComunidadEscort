import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alias: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

export function Avatar({ src, alias, size = 'md', className }: AvatarProps) {
  const initials = alias.slice(0, 2).toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={`Avatar de ${alias}`}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-accent/20 font-semibold text-accent',
        sizeClasses[size],
        className,
      )}
      aria-label={`Avatar de ${alias}`}
    >
      {initials || <User className="h-1/2 w-1/2" />}
    </div>
  )
}
