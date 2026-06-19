export interface ChatParticipant {
  id: string
  alias: string
  avatar_url: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: ChatParticipant
}

export interface ConversationPreview {
  id: string
  updated_at: string
  other_user: ChatParticipant
  last_message: Message | null
  unread_count: number
}
