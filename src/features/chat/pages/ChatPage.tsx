import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { ConversationListItem } from '@/features/chat/components/ConversationListItem'
import { ChatWindow } from '@/features/chat/components/ChatWindow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { chatService } from '@/services/chat.service'
import { cn } from '@/lib/utils'

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => chatService.getConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  })

  const activeConversation = conversations.find((c) => c.id === conversationId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-muted-foreground">Conversaciones privadas con miembros de la comunidad.</p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border bg-card lg:h-[calc(100vh-10rem)]">
        <aside
          className={cn(
            'w-full shrink-0 border-r lg:w-80',
            conversationId ? 'hidden lg:block' : 'block',
          )}
        >
          <div className="overflow-y-auto p-2">
            {isLoading && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            )}

            {!isLoading && conversations.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon={MessageCircle}
                  title="Sin conversaciones"
                  description="Visita el perfil de otra miembro para enviarle un mensaje."
                />
              </div>
            )}

            {conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === conversationId}
                onClick={() => navigate(`/chat/${conv.id}`)}
              />
            ))}
          </div>
        </aside>

        <main
          className={cn(
            'min-w-0 flex-1',
            !conversationId ? 'hidden lg:flex lg:items-center lg:justify-center' : 'flex flex-col',
          )}
        >
          {!conversationId && (
            <div className="hidden text-center text-muted-foreground lg:block">
              <MessageCircle className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-3">Selecciona una conversación</p>
            </div>
          )}

          {conversationId && activeConversation && (
            <ChatWindow
              conversationId={conversationId}
              otherUser={activeConversation.other_user}
              onBack={() => navigate('/chat')}
            />
          )}

          {conversationId && !activeConversation && !isLoading && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Conversación no encontrada
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
