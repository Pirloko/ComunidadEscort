import { supabase } from '@/lib/supabase/client'
import type { ResourceReview } from '@/types/resource-reviews'

const RESOURCE_REVIEW_SELECT = `
  id, resource_id, author_id, rating, body, created_at,
  author:profiles!author_id(id, alias, avatar_url)
`

export const resourceReviewService = {
  async getReviewsByResource(resourceId: string): Promise<ResourceReview[]> {
    const { data, error } = await supabase
      .from('resource_reviews')
      .select(RESOURCE_REVIEW_SELECT)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as ResourceReview[]
  },

  async upsertReview(
    resourceId: string,
    authorId: string,
    rating: number,
    body: string | null,
  ): Promise<ResourceReview> {
    const { data, error } = await supabase
      .from('resource_reviews')
      .upsert(
        { resource_id: resourceId, author_id: authorId, rating, body },
        { onConflict: 'resource_id,author_id' },
      )
      .select(RESOURCE_REVIEW_SELECT)
      .single()

    if (error) throw error
    return data as unknown as ResourceReview
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase.from('resource_reviews').delete().eq('id', reviewId)
    if (error) throw error
  },
}
