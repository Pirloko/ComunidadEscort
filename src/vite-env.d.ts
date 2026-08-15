/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_URL?: string
  readonly VITE_TENOR_API_KEY?: string
  /** Google Analytics 4 Measurement ID (ej: G-XXXXXXXXXX) */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
