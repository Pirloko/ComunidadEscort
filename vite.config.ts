import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-comunidad.png', 'logo-comunidad-light.png', 'logo-icon.png'],
      manifest: {
        name: 'Comunidadescort.cl',
        short_name: 'Comunidad',
        description:
          'Comunidad privada para seguridad, apoyo mutuo y bienestar en Chile',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        lang: 'es',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
