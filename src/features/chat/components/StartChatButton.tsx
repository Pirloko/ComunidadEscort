import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { chatService } from '@/services/chat.service'

interface StartChatButtonProps {
  otherUserId: string
  otherAlias: string
  size?: 'sm' | 'default'
  compact?: boolean
}

export function StartChatButton({
  otherUserId,
  otherAlias,
  size = 'default',
  compact = false,
}: StartChatButtonProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const conversationId = await chatService.getOrCreateConversation(otherUserId)
      navigate(`/chat/${conversationId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo iniciar la conversación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="accent"
      size={size}
      className="gap-2 shrink-0"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      {compact ? 'Mensaje' : `Mensaje a @${otherAlias}`}
    </Button>
  )
}
