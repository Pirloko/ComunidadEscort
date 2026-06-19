import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Ban, ExternalLink, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccountStatusBadge } from '@/features/admin/components/AccountStatusBadge'
import { UserApproveButton, UserReviewModal } from '@/features/admin/components/UserReviewModal'
import { profileService } from '@/services/profile.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatRelativeTime } from '@/lib/format'
import type { AdminProfile } from '@/types/admin'
import type { UserRole } from '@/types/database'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'Usuario' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'admin', label: 'Admin' },
]

interface UserRowProps {
  user: AdminProfile
}

export function UserRow({ user }: UserRowProps) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [reviewMode, setReviewMode] = useState<'reject' | 'block' | null>(null)
  const isSelf = currentUser?.id === user.id

  const updateMutation = useMutation({
    mutationFn: (role: UserRole) => profileService.adminUpdateProfile(user.id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const roleBadgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'bg-primary text-primary-foreground'
    if (role === 'moderator') return 'bg-accent/20 text-accent'
    return ''
  }

  const canReview = !isSelf && user.role === 'user'
  const showApprove = canReview && user.account_status !== 'aprobada'
  const showReject = canReview && user.account_status === 'pendiente'
  const showBlock = canReview && user.account_status !== 'bloqueada'

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/profile/${user.alias}`} className="font-semibold hover:text-accent">
              @{user.alias}
            </Link>
            <Badge className={roleBadgeVariant(user.role)}>{user.role}</Badge>
            <AccountStatusBadge status={user.account_status} />
            {isSelf && <Badge variant="secondary">Tú</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          {user.publication_link && (
            <a
              href={user.publication_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Ver publicación
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {user.rejection_reason && user.account_status !== 'aprobada' && (
            <p className="mt-2 text-sm text-destructive">
              <strong>Motivo:</strong> {user.rejection_reason}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {user.city?.name ?? '—'} · {formatRelativeTime(user.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <select
            value={user.role}
            disabled={isSelf || updateMutation.isPending}
            onChange={(e) => updateMutation.mutate(e.target.value as UserRole)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            title={isSelf ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {canReview && (
            <div className="flex flex-wrap gap-2">
              {showApprove && <UserApproveButton user={user} />}
              {showReject && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive"
                  onClick={() => setReviewMode('reject')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazar
                </Button>
              )}
              {showBlock && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive"
                  onClick={() => setReviewMode('block')}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Bloquear email
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <UserReviewModal
        user={user}
        mode={reviewMode}
        onClose={() => setReviewMode(null)}
      />
    </>
  )
}
