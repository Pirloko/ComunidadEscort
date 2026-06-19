import { supabase } from '@/lib/supabase/client'
import type { Comment } from '@/types/forum'

const COMMENT_SELECT = `
  id, post_id, author_id, parent_id, content,
  likes_count, created_at, updated_at,
  author:profiles!author_id(id, alias, avatar_url)
`

export const commentService = {
  async getCommentsByPost(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error
    const comments = (data ?? []) as unknown as Comment[]

    const roots = comments.filter((c) => !c.parent_id)
    const replies = comments.filter((c) => c.parent_id)

    return roots.map((root) => ({
      ...root,
      replies: replies.filter((r) => r.parent_id === root.id),
    }))
  },

  async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content,
        parent_id: parentId ?? null,
      })
      .select(COMMENT_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Comment
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },

  async toggleLike(commentId: string, userId: string, liked: boolean): Promise<void> {
    if (liked) {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId })
      if (error) throw error
    }
  },
}
