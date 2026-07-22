import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'
import { InstallPwaBanner } from '@/components/shared/InstallPwaBanner'

export function AppShell() {
  return (
    <div className="flex min-h-dvh overflow-x-clip bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <Navbar />
        <main className="content-shell flex-1 overflow-y-auto overflow-x-clip p-3 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:p-4 lg:p-6 lg:pb-6">
          <InstallPwaBanner />
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
