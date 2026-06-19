import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isOwn
            ? 'rounded-br-md bg-accent text-accent-foreground'
            : 'rounded-bl-md bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isOwn ? 'text-accent-foreground/70' : 'text-muted-foreground',
          )}
        >
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
