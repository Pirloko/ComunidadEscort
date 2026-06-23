import { supabase } from '@/lib/supabase/client'

export { cityService } from '@/services/city.service'
export { profileService } from '@/services/profile.service'

export const authService = {
  async signUp(
    email: string,
    password: string,
    alias: string,
    phone: string,
    publicationLink: string,
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { alias, phone, publication_link: publicationLink },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signInWithPhone(phone: string, password: string) {
    const { data, error } = await supabase.functions.invoke<{
      access_token: string
      refresh_token: string
    }>('login-with-phone', { body: { phone, password } })

    if (error || !data?.access_token || !data?.refresh_token) {
      throw new Error('Credenciales inválidas')
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    if (sessionError) throw sessionError
    return sessionData
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  async completeForcedPasswordChange(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error

    const { error: rpcError } = await supabase.rpc('complete_forced_password_change')
    if (rpcError) throw rpcError
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

