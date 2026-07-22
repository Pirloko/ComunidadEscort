import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import type { CommunityMessage } from '@/types/chat'

interface MessageBubbleProps {
  message: CommunityMessage
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const alias = message.sender?.alias
  const kind = message.kind ?? 'text'

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2',
          kind === 'text' &&
            (isOwn
              ? 'rounded-br-md bg-accent text-accent-foreground'
              : 'rounded-bl-md bg-muted text-foreground'),
          (kind === 'gif' || kind === 'sticker') && 'bg-transparent px-1 py-1',
        )}
      >
        {!isOwn && alias && (
          <p
            className={cn(
              'mb-0.5 text-xs font-semibold',
              kind === 'text' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            @{alias}
          </p>
        )}

        {kind === 'sticker' && (
          <p className="select-none text-5xl leading-none sm:text-6xl" aria-label="Sticker">
            {message.content}
          </p>
        )}

        {kind === 'gif' && message.media_url && (
          <img
            src={message.media_url}
            alt={message.content || 'GIF'}
            className="max-h-52 max-w-full rounded-xl object-contain"
            loading="lazy"
          />
        )}

        {kind === 'text' && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        )}

        <p
          className={cn(
            'mt-1 text-[10px]',
            kind === 'text' && isOwn ? 'text-accent-foreground/70' : 'text-muted-foreground',
          )}
        >
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
