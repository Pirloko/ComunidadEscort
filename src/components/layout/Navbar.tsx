import { Moon, Sun } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { UserMenu } from '@/components/layout/UserMenu'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur-sm sm:gap-3 sm:px-4">
      <div className="min-w-0 shrink lg:hidden">
        <BrandLogo size="md" to="/feed" className="h-11 max-w-[min(100%,200px)]" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <NotificationBell />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}
