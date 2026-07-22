export type CommunityMessageKind = 'text' | 'gif' | 'sticker'

export interface ChatParticipant {
  id: string
  alias: string
  avatar_url: string | null
}

export interface CommunityMessage {
  id: string
  sender_id: string
  content: string
  kind: CommunityMessageKind
  media_url: string | null
  created_at: string
  sender?: ChatParticipant
}

export interface SendCommunityMessageInput {
  senderId: string
  kind: CommunityMessageKind
  content?: string
  mediaUrl?: string | null
}
