import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/hooks/useAuth'
import { CityProvider } from '@/features/cities/context/CityContext'
import { ThemeProvider } from '@/hooks/useTheme'
import { DeviceGate } from '@/components/shared/DeviceGate'
import { AppRouter } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <DeviceGate>
              <CityProvider>
                <AppRouter />
              </CityProvider>
            </DeviceGate>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
