import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { chatService } from '@/services/chat.service'
import type { ChatParticipant } from '@/types/chat'

interface ChatWindowProps {
  conversationId: string
  otherUser: ChatParticipant
  onBack?: () => void
}

export function ChatWindow({ conversationId, otherUser, onBack }: ChatWindowProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: !!conversationId,
  })

  useEffect(() => {
    if (user && conversationId) {
      chatService.markAsRead(conversationId, user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      })
    }
  }, [conversationId, user, messages.length, queryClient])

  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(conversationId, (message) => {
      queryClient.setQueryData(['messages', conversationId], (old: typeof messages) => {
        if (!old) return [message]
        if (old.some((m) => m.id === message.id)) return old
        return [...old, message]
      })
      if (message.sender_id !== user?.id) {
        chatService.markAsRead(conversationId, user!.id)
      }
    })
    return unsubscribe
  }, [conversationId, queryClient, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatService.sendMessage(conversationId, user!.id, text),
    onSuccess: (message) => {
      queryClient.setQueryData(['messages', conversationId], (old: typeof messages) => [
        ...(old ?? []),
        message,
      ])
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setContent('')
    },
  })

  const handleSend = () => {
    const text = content.trim()
    if (!text || !user) return
    sendMutation.mutate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar src={otherUser.avatar_url} alias={otherUser.alias} size="sm" />
        <div>
          <p className="font-semibold">@{otherUser.alias}</p>
          <p className="text-xs text-muted-foreground">Mensaje privado</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <>
            <Skeleton className="ml-auto h-12 w-48 rounded-2xl" />
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="min-h-[44px] resize-none"
          />
          <Button
            variant="accent"
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
