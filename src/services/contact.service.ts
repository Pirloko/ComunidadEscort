import { supabase } from '@/lib/supabase/client'
import { normalizePhoneChile } from '@/lib/phone'
import type { ContactMessage, SubmitContactMessageInput } from '@/types/contact'

const SELECT =
  'id, name, email, phone, subject, message, is_read, read_at, read_by, created_at'

export const contactService = {
  async submit(input: SubmitContactMessageInput): Promise<void> {
    let phone: string | null = null
    if (input.phone?.trim()) {
      phone = normalizePhoneChile(input.phone)
    }

    const { error } = await supabase.from('contact_messages').insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone,
      subject: input.subject.trim(),
      message: input.message.trim(),
    })

    if (error) throw error
  },

  async listAll(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select(SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as ContactMessage[]
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) throw error
    return count ?? 0
  },

  async markAsRead(id: string, adminId: string): Promise<ContactMessage> {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: adminId,
      })
      .eq('id', id)
      .select(SELECT)
      .single()

    if (error) throw error
    return data as ContactMessage
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id)
    if (error) throw error
  },
}
