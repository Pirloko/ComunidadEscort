import { supabase } from '@/lib/supabase/client'
import type { Alert } from '@/types/alerts'
import type { Post } from '@/types/forum'
import type { ModerationComment } from '@/types/moderation'
import type { CreateReportInput, Report, ReportWithTarget, ReviewReportInput } from '@/types/reports'
import { reportKey } from '@/types/reports'

const REPORT_SELECT = `
  id, reporter_id, target_type, target_id, reason, details, status,
  reviewed_by, reviewed_at, created_at,
  reporter:profiles!reporter_id(id, alias, avatar_url)
`

const POST_SELECT = `
  id, author_id, city_id, category, title, content,
  is_pinned, is_locked, likes_count, comments_count,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

const COMMENT_SELECT = `
  id, post_id, author_id, parent_id, content,
  likes_count, created_at,
  author:profiles!author_id(id, alias, avatar_url),
  post:posts!post_id(id, title, city:cities!city_id(id, name))
`

const ALERT_SELECT = `
  id, author_id, city_id, category, status, title, description,
  location_detail, reviewed_by, reviewed_at, rejection_reason,
  created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url),
  city:cities!city_id(id, name, slug)
`

export const reportService = {
  async getReportedKeys(reporterId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('target_type, target_id')
      .eq('reporter_id', reporterId)

    if (error) throw error
    return (data ?? []).map((r) => reportKey(r.target_type, r.target_id))
  },

  async createReport(reporterId: string, input: CreateReportInput): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({ ...input, reporter_id: reporterId })
      .select(REPORT_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Report
  },

  async getPendingReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select(REPORT_SELECT)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as Report[]
  },

  async reviewReport(
    reportId: string,
    reviewerId: string,
    input: ReviewReportInput,
  ): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({
        status: input.status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (error) throw error
  },

  async getReportsWithTargets(reports: Report[]): Promise<ReportWithTarget[]> {
    const postIds = reports.filter((r) => r.target_type === 'post').map((r) => r.target_id)
    const commentIds = reports.filter((r) => r.target_type === 'comment').map((r) => r.target_id)
    const alertIds = reports.filter((r) => r.target_type === 'alert').map((r) => r.target_id)

    const [postsRes, commentsRes, alertsRes] = await Promise.all([
      postIds.length
        ? supabase.from('posts').select(POST_SELECT).in('id', postIds)
        : Promise.resolve({ data: [], error: null }),
      commentIds.length
        ? supabase.from('comments').select(COMMENT_SELECT).in('id', commentIds)
        : Promise.resolve({ data: [], error: null }),
      alertIds.length
        ? supabase.from('alerts').select(ALERT_SELECT).in('id', alertIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (postsRes.error) throw postsRes.error
    if (commentsRes.error) throw commentsRes.error
    if (alertsRes.error) throw alertsRes.error

    const postsMap = new Map(((postsRes.data ?? []) as unknown as Post[]).map((p) => [p.id, p]))
    const commentsMap = new Map(
      ((commentsRes.data ?? []) as unknown as ModerationComment[]).map((c) => [c.id, c]),
    )
    const alertsMap = new Map(((alertsRes.data ?? []) as unknown as Alert[]).map((a) => [a.id, a]))

    return reports.map((report) => {
      if (report.target_type === 'post') {
        const post = postsMap.get(report.target_id)
        return { report, target: post ? { type: 'post' as const, post } : null }
      }
      if (report.target_type === 'comment') {
        const comment = commentsMap.get(report.target_id)
        return { report, target: comment ? { type: 'comment' as const, comment } : null }
      }
      const alert = alertsMap.get(report.target_id)
      return { report, target: alert ? { type: 'alert' as const, alert } : null }
    })
  },
}
