import { supabase } from '@/lib/supabase/client'
import type { ResourceComment } from '@/types/resource-comments'

const RESOURCE_COMMENT_SELECT = `
  id, resource_id, author_id, content, created_at,
  author:profiles!author_id(id, alias, avatar_url)
`

export const resourceCommentService = {
  async getCommentsByResource(resourceId: string): Promise<ResourceComment[]> {
    const { data, error } = await supabase
      .from('resource_comments')
      .select(RESOURCE_COMMENT_SELECT)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as ResourceComment[]
  },

  async createComment(
    resourceId: string,
    authorId: string,
    content: string,
  ): Promise<ResourceComment> {
    const { data, error } = await supabase
      .from('resource_comments')
      .insert({ resource_id: resourceId, author_id: authorId, content })
      .select(RESOURCE_COMMENT_SELECT)
      .single()

    if (error) throw error
    return data as unknown as ResourceComment
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('resource_comments').delete().eq('id', commentId)
    if (error) throw error
  },
}
