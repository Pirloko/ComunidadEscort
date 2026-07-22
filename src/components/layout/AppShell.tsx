import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'
import { InstallPwaBanner } from '@/components/shared/InstallPwaBanner'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-4 lg:p-6 lg:pb-6">
          <InstallPwaBanner />
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
