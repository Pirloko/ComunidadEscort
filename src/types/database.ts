export type UserRole = 'user' | 'moderator' | 'admin'

export type PostCategory =
  | 'seguridad'
  | 'consejos'
  | 'salud'
  | 'bienestar'
  | 'transporte'
  | 'recursos_utiles'
  | 'conversaciones_generales'

export type AlertCategory =
  | 'estafa'
  | 'robo'
  | 'incidente_seguridad'
  | 'advertencia'
  | 'acoso'
  | 'violencia'
  | 'no_pago'
  | 'cliente_peligroso'
  | 'recomendacion'
  | 'otro'

export type AlertReportKind = 'funar' | 'recomendar'

export type AlertStatus = 'pendiente' | 'aprobada' | 'rechazada'

export type AccountStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'bloqueada'

export type ResourceCategory =
  | 'delivery'
  | 'farmacia'
  | 'botilleria'
  | 'carniceria'
  | 'supermercado'
  | 'taxis_uber'
  | 'salud'
  | 'juridico'
  | 'habitaciones_escort'
  | 'hoteles'
  | 'tours_ciudad'
  | 'gym'
  | 'otros'

export type BookmarkType = 'post' | 'resource' | 'alert'

export type ReportTargetType = 'post' | 'comment' | 'alert'

export type ReportReason =
  | 'spam'
  | 'contenido_inapropiado'
  | 'acoso'
  | 'informacion_falsa'
  | 'otro'

export type ReportStatus = 'pendiente' | 'resuelto' | 'descartado'

export type NotificationType =
  | 'new_comment'
  | 'new_reply'
  | 'alert_approved'
  | 'alert_rejected'
  | 'resource_approved'
  | 'resource_rejected'
  | 'account_approved'
  | 'account_rejected'
  | 'new_message'
  | 'mention'

export interface PrivacySettings {
  show_city: boolean
  show_description: boolean
  allow_messages: boolean
}

export interface PublicProfile {
  id: string
  alias: string
  city_id: string | null
  avatar_url: string | null
  description: string | null
  privacy_settings: PrivacySettings
  created_at: string
}

export interface Profile extends PublicProfile {
  email: string
  phone: string | null
  publication_link: string | null
  account_status: AccountStatus
  rejection_reason: string | null
  role: UserRole
  is_active: boolean
  must_change_password: boolean
  last_seen_at: string | null
  updated_at: string
}

export interface City {
  id: string
  name: string
  slug: string
  region_name?: string
}

export interface Region {
  id: string
  name: string
  code: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'last_seen_at'> & {
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
        }
        Update: Partial<Profile>
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          name: string
          slug: string
          region_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          region_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<{
          name: string
          slug: string
          region_id: string
          is_active: boolean
        }>
        Relationships: []
      }
      regions: {
        Row: Region & { created_at: string }
        Insert: { id?: string; name: string; code: string; created_at?: string }
        Update: Partial<{ name: string; code: string }>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_public_cities: {
        Args: Record<string, never>
        Returns: {
          id: string
          name: string
          slug: string
          region_name: string
        }[]
      }
      is_alias_available: {
        Args: {
          p_alias: string
        }
        Returns: boolean
      }
      is_email_blocked: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
