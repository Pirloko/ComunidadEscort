import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut, ChevronDown, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function UserMenu() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!profile) return null

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-2"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar src={profile.avatar_url} alias={profile.alias} size="sm" />
        <span className="hidden text-sm sm:inline">@{profile.alias}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-md border bg-card py-1 shadow-lg">
          <Link
            to={`/profile/${profile.alias}`}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="h-4 w-4" />
            Mensajes
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
