import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cityService } from '@/services/city.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { STORAGE_KEYS } from '@/lib/constants'
import type { City } from '@/types/database'

interface CityContextValue {
  cities: City[]
  selectedCity: City | null
  selectedCityId: string | null
  setSelectedCityId: (cityId: string | null) => void
  isLoading: boolean
}

const CityContext = createContext<CityContextValue | undefined>(undefined)

export function CityProvider({ children }: { children: ReactNode }) {
  const { profile, session } = useAuth()
  const [selectedCityId, setSelectedCityIdState] = useState<string | null>(null)

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => cityService.getPublicCities(),
    enabled: !!session,
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (!cities.length) return

    const stored = localStorage.getItem(STORAGE_KEYS.selectedCityId)
    const storedCity = cities.find((c) => c.id === stored)
    const profileCity = cities.find((c) => c.id === profile?.city_id)

    if (storedCity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCityIdState(storedCity.id)
    } else if (profileCity) {
      setSelectedCityIdState(profileCity.id)
      localStorage.setItem(STORAGE_KEYS.selectedCityId, profileCity.id)
    } else {
      // Sin ciudad de perfil ni guardada: no inventar una (p. ej. Ancud por orden alfabético)
      setSelectedCityIdState(null)
    }
  }, [cities, profile?.city_id])

  const setSelectedCityId = (cityId: string | null) => {
    setSelectedCityIdState(cityId)
    if (cityId) {
      localStorage.setItem(STORAGE_KEYS.selectedCityId, cityId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.selectedCityId)
    }
  }

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  )

  return (
    <CityContext.Provider
      value={{ cities, selectedCity, selectedCityId, setSelectedCityId, isLoading }}
    >
      {children}
    </CityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCity() {
  const context = useContext(CityContext)
  if (!context) throw new Error('useCity debe usarse dentro de CityProvider')
  return context
}
