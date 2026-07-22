import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import { ChatComposer } from '@/features/chat/components/ChatComposer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { chatService } from '@/services/chat.service'
import type { CommunityMessage, CommunityMessageKind } from '@/types/chat'

export function ChatPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['community-messages'],
    queryFn: () => chatService.getCommunityMessages(),
  })

  useEffect(() => {
    const unsubscribe = chatService.subscribeToCommunityMessages((message) => {
      queryClient.setQueryData(['community-messages'], (old: CommunityMessage[] | undefined) => {
        if (!old) return [message]
        if (old.some((m) => m.id === message.id)) return old
        return [...old, message]
      })
    })
    return unsubscribe
  }, [queryClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (input: {
      kind: CommunityMessageKind
      content: string
      mediaUrl?: string | null
    }) =>
      chatService.sendCommunityMessage({
        senderId: user!.id,
        kind: input.kind,
        content: input.content,
        mediaUrl: input.mediaUrl,
      }),
    onSuccess: (message) => {
      queryClient.setQueryData(['community-messages'], (old: CommunityMessage[] | undefined) => {
        if (!old) return [message]
        if (old.some((m) => m.id === message.id)) return old
        return [...old, message]
      })
    },
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-4">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Chat de la comunidad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sala única para todas las miembros. Envía texto, emoticones, stickers o GIFs.
        </p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-xl border bg-card lg:h-[calc(100vh-10rem)]">
        <div className="flex items-center gap-2 border-b px-4 py-3 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          Todas las miembros pueden leer y escribir aquí
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading && (
            <>
              <Skeleton className="h-12 w-48 rounded-2xl" />
              <Skeleton className="ml-auto h-12 w-52 rounded-2xl" />
              <Skeleton className="h-12 w-40 rounded-2xl" />
            </>
          )}

          {isError && <ErrorState onRetry={() => void refetch()} />}

          {!isLoading && !isError && messages.length === 0 && (
            <EmptyState
              icon={MessageCircle}
              title="Aún no hay mensajes"
              description="Sé la primera en saludar a la comunidad."
            />
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
          ))}
          <div ref={bottomRef} />
        </div>

        <ChatComposer
          disabled={!user}
          sending={sendMutation.isPending}
          onSendText={(text) => sendMutation.mutate({ kind: 'text', content: text })}
          onSendMedia={({ kind, content, mediaUrl }) =>
            sendMutation.mutate({ kind, content, mediaUrl })
          }
        />
      </div>
    </div>
  )
}
