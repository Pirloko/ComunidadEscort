import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Flag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatRelativeTime } from '@/lib/format'
import { getReportReasonLabel, REPORT_TARGET_LABELS } from '@/lib/reports'
import { reportService } from '@/services/report.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ReportWithTarget } from '@/types/reports'

function ReportTargetPreview({ target }: { target: ReportWithTarget['target'] }) {
  if (!target) {
    return (
      <p className="text-sm italic text-muted-foreground">
        El contenido reportado ya no existe.
      </p>
    )
  }

  if (target.type === 'post') {
    return (
      <Link
        to={`/forum/${target.post.id}`}
        className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
      >
        <p className="font-medium">{target.post.title}</p>
        <p className="mt-1 text-muted-foreground line-clamp-2">{target.post.content}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Por @{target.post.author?.alias ?? '—'}
        </p>
      </Link>
    )
  }

  if (target.type === 'comment') {
    return (
      <Link
        to={`/forum/${target.comment.post_id}`}
        className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
      >
        <p className="text-muted-foreground">En: {target.comment.post?.title ?? 'Publicación'}</p>
        <p className="mt-1">{target.comment.content}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Por @{target.comment.author?.alias ?? '—'}
        </p>
      </Link>
    )
  }

  return (
    <Link
      to={`/alerts/${target.alert.id}`}
      className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
    >
      <p className="font-medium">{target.alert.title}</p>
      <p className="mt-1 text-muted-foreground line-clamp-2">{target.alert.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Por @{target.alert.author?.alias ?? '—'}
      </p>
    </Link>
  )
}

export function ModerationReportsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['pending-reports'],
    queryFn: () => reportService.getPendingReports(),
  })

  const { data: reportsWithTargets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['pending-reports-targets', reports.map((r) => r.id)],
    queryFn: () => reportService.getReportsWithTargets(reports),
    enabled: reports.length > 0,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: 'resuelto' | 'descartado' }) =>
      reportService.reviewReport(reportId, user!.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reports'] })
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] })
    },
  })

  const loading = isLoading || (reports.length > 0 && targetsLoading)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reportes pendientes ({reports.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState
            icon={Flag}
            title="Sin reportes pendientes"
            description="No hay contenido reportado esperando revisión."
          />
        )}

        <ul className="divide-y">
          {!loading &&
            reportsWithTargets.map(({ report, target }) => (
              <li key={report.id} className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    {REPORT_TARGET_LABELS[report.target_type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getReportReasonLabel(report.reason)} · {formatRelativeTime(report.created_at)}
                  </span>
                </div>

                <ReportTargetPreview target={target} />

                {report.details && (
                  <p className="rounded-lg bg-muted p-3 text-sm">
                    <strong>Detalles de @{report.reporter?.alias ?? 'anónima'}:</strong>{' '}
                    {report.details}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1 bg-success hover:bg-success/90"
                    onClick={() => reviewMutation.mutate({ reportId: report.id, status: 'resuelto' })}
                    disabled={reviewMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marcar resuelto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      reviewMutation.mutate({ reportId: report.id, status: 'descartado' })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    Descartar
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  )
}
