import type { ReactNode } from 'react'
import { Ban, CheckCircle2, Circle, Clock, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AccountStatus } from '@/types/database'

type StepState = 'done' | 'active' | 'failed' | 'upcoming'

interface Step {
  title: string
  description: ReactNode
  state: StepState
  icon: LucideIcon
}

const STATE_CLASSES: Record<StepState, string> = {
  done: 'bg-success/10 text-success',
  active: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  failed: 'bg-destructive/10 text-destructive',
  upcoming: 'bg-muted text-muted-foreground',
}

interface ApprovalTimelineProps {
  status: AccountStatus
  publicationLink: string | null
}

export function ApprovalTimeline({ status, publicationLink }: ApprovalTimelineProps) {
  const reviewState: StepState = status === 'pendiente' ? 'active' : 'done'
  const resultState: StepState =
    status === 'pendiente' ? 'upcoming' : status === 'aprobada' ? 'done' : 'failed'

  const steps: Step[] = [
    {
      title: 'Registro recibido',
      description: 'Completaste tus datos y el link de tu publicación para verificación.',
      state: 'done',
      icon: CheckCircle2,
    },
    {
      title: 'Revisión de la administración',
      description:
        status === 'pendiente' && publicationLink ? (
          <>
            Una administradora revisa el link de tu publicación para confirmar tu identidad y
            te contacta al número que aparece en ella.{' '}
            <a
              href={publicationLink}
              target="_blank"
              rel="noreferrer"
              className="break-all text-accent hover:underline"
            >
              Ver link enviado
            </a>
          </>
        ) : (
          'Una administradora revisó el link de tu publicación para confirmar tu identidad.'
        ),
      state: reviewState,
      icon: reviewState === 'active' ? Clock : CheckCircle2,
    },
    {
      title: 'Resultado',
      description:
        status === 'aprobada'
          ? 'Tu cuenta fue aprobada. Ya puedes ingresar a la comunidad.'
          : status === 'rechazada'
            ? 'Tu solicitud fue rechazada.'
            : status === 'bloqueada'
              ? 'El acceso a esta cuenta fue bloqueado.'
              : 'Te avisaremos aquí en cuanto tengamos una respuesta.',
      state: resultState,
      icon:
        status === 'aprobada'
          ? CheckCircle2
          : status === 'rechazada'
            ? XCircle
            : status === 'bloqueada'
              ? Ban
              : Circle,
    },
  ]

  return (
    <ol className="space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-3">
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute left-4 top-9 h-[calc(100%-0.5rem)] w-px bg-border"
            />
          )}
          <span
            className={cn(
              'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              STATE_CLASSES[step.state],
            )}
          >
            <step.icon className="h-4 w-4" />
          </span>
          <div className="pb-1 text-left">
            <p
              className={cn(
                'text-sm font-medium',
                step.state === 'upcoming' && 'text-muted-foreground',
              )}
            >
              {step.title}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
