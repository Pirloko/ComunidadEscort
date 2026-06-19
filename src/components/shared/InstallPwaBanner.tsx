import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === '1',
  )
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
    setDeferredPrompt(null)
  }

  if (isStandalone || dismissed || !deferredPrompt) return null

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border bg-accent/10 p-4">
      <Download className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Instalar la app</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Accede más rápido desde tu pantalla de inicio.
        </p>
        <Button size="sm" className="mt-3" onClick={handleInstall}>
          Instalar
        </Button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
