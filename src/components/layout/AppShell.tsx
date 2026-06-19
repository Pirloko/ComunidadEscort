import { createContext, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'
import { InstallPwaBanner } from '@/components/shared/InstallPwaBanner'

interface SearchContextValue {
  search: string
  setSearch: (value: string) => void
}

const SearchContext = createContext<SearchContextValue>({ search: '', setSearch: () => {} })

export function useSearch() {
  return useContext(SearchContext)
}

export function AppShell() {
  const [search, setSearch] = useState('')

  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar search={search} onSearchChange={setSearch} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
            <InstallPwaBanner />
            <Outlet />
          </main>
          <MobileNav />
        </div>
      </div>
    </SearchContext.Provider>
  )
}
