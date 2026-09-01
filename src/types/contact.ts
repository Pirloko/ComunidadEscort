export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: boolean
  read_at: string | null
  read_by: string | null
  created_at: string
}

export interface SubmitContactMessageInput {
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}
