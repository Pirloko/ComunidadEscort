import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { postService } from '@/services/post.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LikeButtonProps {
  postId: string
  initialCount: number
  initialLiked: boolean
  size?: 'sm' | 'md'
}

export function LikeButton({ postId, initialCount, initialLiked, size = 'md' }: LikeButtonProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)

  const mutation = useMutation({
    mutationFn: () => postService.toggleLike(postId, user!.id, liked),
    onMutate: () => {
      setLiked(!liked)
      setCount((c) => (liked ? c - 1 : c + 1))
    },
    onError: () => {
      setLiked(liked)
      setCount(initialCount)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn('gap-1.5 text-muted-foreground hover:text-destructive', liked && 'text-destructive')}
      onClick={() => mutation.mutate()}
      disabled={!user || mutation.isPending}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
