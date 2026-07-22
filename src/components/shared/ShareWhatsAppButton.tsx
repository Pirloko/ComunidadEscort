import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { whatsappShareUrl } from '@/lib/share'
import { cn } from '@/lib/utils'

interface ShareWhatsAppButtonProps {
  text: string
  label?: string
  size?: 'sm' | 'icon' | 'default'
  variant?: 'outline' | 'ghost' | 'secondary'
  className?: string
}

export function ShareWhatsAppButton({
  text,
  label = 'Compartir con alguna amiga',
  size = 'sm',
  variant = 'outline',
  className,
}: ShareWhatsAppButtonProps) {
  const openShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(whatsappShareUrl(text), '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={openShare}
      className={cn(
        'gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400',
        className,
      )}
      aria-label="Compartir con alguna amiga"
    >
      <MessageCircle className="h-4 w-4" />
      {size !== 'icon' && <span>{label}</span>}
    </Button>
  )
}
