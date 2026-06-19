import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { reportService } from '@/services/report.service'
import type { ReportTargetType } from '@/types/database'
import type { CreateReportInput } from '@/types/reports'
import { reportKey } from '@/types/reports'

export function useReports() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const reportedQuery = useQuery({
    queryKey: ['reported-keys', user?.id],
    queryFn: () => reportService.getReportedKeys(user!.id),
    enabled: !!user?.id,
    select: (keys) => new Set(keys),
  })

  const submitMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportService.createReport(user!.id, input),
    onSuccess: (_report, input) => {
      const key = ['reported-keys', user?.id] as const
      const previous = queryClient.getQueryData<Set<string>>(key)
      const next = new Set(previous ?? [])
      next.add(reportKey(input.target_type, input.target_id))
      queryClient.setQueryData(key, next)
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] })
    },
  })

  const hasReported = (targetType: ReportTargetType, targetId: string) =>
    reportedQuery.data?.has(reportKey(targetType, targetId)) ?? false

  return {
    hasReported,
    submitReport: submitMutation.mutateAsync,
    isPending: submitMutation.isPending,
  }
}
