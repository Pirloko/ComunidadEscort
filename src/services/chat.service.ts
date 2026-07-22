import { supabase } from '@/lib/supabase/client'
import type { CommunityMessage, SendCommunityMessageInput } from '@/types/chat'

const MESSAGE_SELECT = `
  id, sender_id, content, kind, media_url, created_at,
  sender:profiles!sender_id(id, alias, avatar_url)
`

const PAGE_SIZE = 100

export const chatService = {
  async getCommunityMessages(limit = PAGE_SIZE): Promise<CommunityMessage[]> {
    const { data, error } = await supabase
      .from('community_messages')
      .select(MESSAGE_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    const rows = (data ?? []) as unknown as CommunityMessage[]
    return rows.reverse()
  },

  async sendCommunityMessage(input: SendCommunityMessageInput): Promise<CommunityMessage> {
    const payload = {
      sender_id: input.senderId,
      kind: input.kind,
      content: (input.content ?? '').trim(),
      media_url: input.mediaUrl ?? null,
    }

    const { data, error } = await supabase
      .from('community_messages')
      .insert(payload)
      .select(MESSAGE_SELECT)
      .single()

    if (error) throw error
    return data as unknown as CommunityMessage
  },

  subscribeToCommunityMessages(onMessage: (message: CommunityMessage) => void) {
    const channel = supabase
      .channel('community_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        async (payload) => {
          const { data } = await supabase
            .from('community_messages')
            .select(MESSAGE_SELECT)
            .eq('id', payload.new.id as string)
            .single()

          if (data) onMessage(data as unknown as CommunityMessage)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
