import { supabase } from '@/lib/supabase/client'
import type { ConversationPreview, Message } from '@/types/chat'

const MESSAGE_SELECT = `
  id, conversation_id, sender_id, content, created_at,
  sender:profiles!sender_id(id, alias, avatar_url)
`

export const chatService = {
  async getOrCreateConversation(otherUserId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      p_other_user_id: otherUserId,
    })
    if (error) throw error
    return data as string
  },

  async getConversations(userId: string): Promise<ConversationPreview[]> {
    const { data: participations, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (pError) throw pError
    if (!participations?.length) return []

    const previews: ConversationPreview[] = []

    for (const p of participations) {
      const { data: others, error: oError } = await supabase
        .from('conversation_participants')
        .select('user_id, profile:profiles!user_id(id, alias, avatar_url)')
        .eq('conversation_id', p.conversation_id)
        .neq('user_id', userId)
        .limit(1)

      if (oError || !others?.length) continue

      const profileData = (others[0] as { profile: { id: string; alias: string; avatar_url: string | null } | { id: string; alias: string; avatar_url: string | null }[] }).profile
      const otherRaw = Array.isArray(profileData) ? profileData[0] : profileData
      if (!otherRaw) continue

      const { data: conv } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .eq('id', p.conversation_id)
        .single()

      const { data: lastMessages } = await supabase
        .from('messages')
        .select(MESSAGE_SELECT)
        .eq('conversation_id', p.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const lastMessage = (lastMessages?.[0] ?? null) as unknown as Message | null

      let unreadCount = 0
      if (lastMessage && lastMessage.sender_id !== userId) {
        const lastRead = p.last_read_at ? new Date(p.last_read_at) : new Date(0)
        if (new Date(lastMessage.created_at) > lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id)
            .neq('sender_id', userId)
            .gt('created_at', p.last_read_at ?? '1970-01-01')

          unreadCount = count ?? 1
        }
      }

      previews.push({
        id: p.conversation_id,
        updated_at: conv?.updated_at ?? '',
        other_user: otherRaw,
        last_message: lastMessage,
        unread_count: unreadCount,
      })
    }

    return previews.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as Message[]
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select(MESSAGE_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Message
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    if (error) throw error
  },

  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void,
  ) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(MESSAGE_SELECT)
            .eq('id', payload.new.id as string)
            .single()

          if (data) onMessage(data as unknown as Message)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
