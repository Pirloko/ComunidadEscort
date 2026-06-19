import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <Shield className="h-8 w-8 text-accent" />
          <span className="text-xl font-bold">{APP_NAME}</span>
        </Link>
        <p className="text-sm text-muted-foreground">Comunidad privada · Seguridad · Apoyo mutuo</p>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
