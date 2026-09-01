import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_TAGLINE } from '@/lib/constants'
import { ContactModal } from '@/features/home/components/ContactModal'

export function HomeFooter() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <footer className="border-t border-white/5 pt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {APP_TAGLINE}
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80">Comunidad privada · Chile</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 rounded-full border-white/15 bg-card/40 px-4"
          onClick={() => setContactOpen(true)}
        >
          <Mail className="h-3.5 w-3.5" />
          Contáctanos
        </Button>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
