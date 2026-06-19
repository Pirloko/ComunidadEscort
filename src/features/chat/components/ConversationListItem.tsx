import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'
import { formatRelativeTime, truncateText } from '@/lib/format'
import type { ConversationPreview } from '@/types/chat'

interface ConversationListItemProps {
  conversation: ConversationPreview
  isActive?: boolean
  onClick: () => void
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const { other_user, last_message, unread_count } = conversation

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors',
        isActive ? 'bg-accent/10' : 'hover:bg-muted',
      )}
    >
      <Avatar src={other_user.avatar_url} alias={other_user.alias} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium', unread_count > 0 && 'text-accent')}>
            @{other_user.alias}
          </span>
          {last_message && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(last_message.created_at)}
            </span>
          )}
        </div>
        {last_message ? (
          <p
            className={cn(
              'mt-0.5 truncate text-sm',
              unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            {last_message.sender_id === other_user.id ? '' : 'Tú: '}
            {truncateText(last_message.content, 50)}
          </p>
        ) : (
          <p className="mt-0.5 text-sm italic text-muted-foreground">Sin mensajes aún</p>
        )}
      </div>
      {unread_count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
          {unread_count > 9 ? '9+' : unread_count}
        </span>
      )}
    </button>
  )
}
