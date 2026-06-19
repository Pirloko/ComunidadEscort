import { Search } from 'lucide-react'
import { CitySelector } from '@/features/cities/components/CitySelector'
import { UserMenu } from '@/components/layout/UserMenu'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Moon, Sun } from 'lucide-react'

interface NavbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function Navbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Buscar alertas, recursos, publicaciones...',
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur-sm">
      <div className="relative hidden flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 bg-muted/50 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <CitySelector />
        <NotificationBell />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}
