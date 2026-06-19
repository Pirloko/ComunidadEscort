import type { ReportReason, ReportStatus, ReportTargetType } from '@/types/database'
import type { Alert } from '@/types/alerts'
import type { Post } from '@/types/forum'
import type { ModerationComment } from '@/types/moderation'

export interface ReportReporter {
  id: string
  alias: string
  avatar_url: string | null
}

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reporter?: ReportReporter
}

export interface CreateReportInput {
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  details?: string
}

export interface ReviewReportInput {
  status: 'resuelto' | 'descartado'
}

export type ReportTarget =
  | { type: 'post'; post: Post }
  | { type: 'comment'; comment: ModerationComment }
  | { type: 'alert'; alert: Alert }

export interface ReportWithTarget {
  report: Report
  target: ReportTarget | null
}

export function reportKey(type: ReportTargetType, id: string): string {
  return `${type}:${id}`
}
