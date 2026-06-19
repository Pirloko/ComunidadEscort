import type { BookmarkType } from '@/types/database'
import type { Alert } from '@/types/alerts'
import type { Post } from '@/types/forum'
import type { Resource } from '@/types/resources'

export interface Bookmark {
  id: string
  user_id: string
  item_type: BookmarkType
  item_id: string
  created_at: string
}

export type BookmarkWithItem =
  | { bookmark: Bookmark; item_type: 'post'; item: Post }
  | { bookmark: Bookmark; item_type: 'alert'; item: Alert }
  | { bookmark: Bookmark; item_type: 'resource'; item: Resource }

export function bookmarkKey(type: BookmarkType, id: string): string {
  return `${type}:${id}`
}
