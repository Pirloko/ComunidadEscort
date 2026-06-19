import { Link } from 'react-router-dom'
import { MessageCircle, MapPin, Pin } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { Card, CardContent } from '@/components/ui/card'
import { LikeButton } from '@/features/forum/components/LikeButton'
import { BookmarkButton } from '@/features/bookmarks/components/BookmarkButton'
import { formatRelativeTime, truncateText } from '@/lib/format'
import type { Post } from '@/types/forum'

interface PostCardProps {
  post: Post
  compact?: boolean
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const author = post.author

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {author && (
            <Link to={`/profile/${author.alias}`}>
              <Avatar src={author.avatar_url} alias={author.alias} size="md" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {author && (
                <Link
                  to={`/profile/${author.alias}`}
                  className="text-sm font-semibold hover:text-accent"
                >
                  @{author.alias}
                </Link>
              )}
              <CategoryBadge category={post.category} />
              {post.is_pinned && (
                <span className="inline-flex items-center gap-1 text-xs text-accent">
                  <Pin className="h-3 w-3" /> Fijado
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {post.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.city.name}
                </span>
              )}
              <span>·</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>

            <Link to={`/forum/${post.id}`} className="block mt-3 group">
              <h3 className="font-semibold leading-snug group-hover:text-accent transition-colors">
                {post.title}
              </h3>
              {!compact && (
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                  {truncateText(post.content, 180)}
                </p>
              )}
            </Link>

            <div className="mt-3 flex items-center gap-1 border-t pt-3">
              <LikeButton
                postId={post.id}
                initialCount={post.likes_count}
                initialLiked={post.liked_by_me ?? false}
                size="sm"
              />
              <BookmarkButton itemType="post" itemId={post.id} size="sm" />
              <Link to={`/forum/${post.id}`}>
                <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
