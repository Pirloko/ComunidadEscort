import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  contactFormSchema,
  type ContactFormData,
} from '@/features/home/schemas/contact.schema'
import { contactService } from '@/services/contact.service'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      contactService.submit({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
      }),
    onSuccess: () => {
      setSent(true)
      reset()
    },
  })

  if (!open) return null

  const handleClose = () => {
    setSent(false)
    reset()
    submitMutation.reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="contact-modal-title" className="flex items-center gap-2 font-semibold">
            <Mail className="h-4 w-4 text-primary" />
            Contáctanos
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="space-y-4 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <div className="space-y-1">
              <p className="font-semibold">Mensaje enviado</p>
              <p className="text-sm text-muted-foreground">
                Gracias por escribirnos. Te responderemos a la brevedad.
              </p>
            </div>
            <Button type="button" variant="accent" className="w-full" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => submitMutation.mutate(data))} className="space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              Escríbenos y el equipo te responderá lo antes posible.
            </p>

            {submitMutation.isError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {(submitMutation.error as Error)?.message ?? 'No se pudo enviar el mensaje'}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contact-name">Nombre *</Label>
              <Input id="contact-name" autoComplete="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Número (opcional)</Label>
              <Input
                id="contact-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+56 9 1234 5678"
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Asunto *</Label>
              <Input id="contact-subject" {...register('subject')} />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Mensaje *</Label>
              <Textarea
                id="contact-message"
                rows={4}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                {...register('message')}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="accent" className="flex-1" disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar mensaje
              </Button>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
