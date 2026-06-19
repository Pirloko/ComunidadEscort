import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createPostSchema, type CreatePostFormData } from '@/features/forum/schemas/forum.schema'
import { POST_CATEGORIES } from '@/lib/forum'
import { postService } from '@/services/post.service'
import type { Post } from '@/types/forum'

interface PostFormProps {
  cityId: string
  authorId: string
  initialData?: Post
  onSuccess: (post: Post) => void
}

export function PostForm({ cityId, authorId, initialData, onSuccess }: PostFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData

  const categories = POST_CATEGORIES.filter((c) => c.value !== 'all')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      category: initialData?.category ?? 'seguridad',
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
    },
  })

  const onSubmit = async (data: CreatePostFormData) => {
    setError(null)
    try {
      const post = isEditing
        ? await postService.updatePost(initialData.id, data)
        : await postService.createPost(authorId, { ...data, city_id: cityId })
      onSuccess(post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la publicación')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select
          id="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('category')}
        >
          {categories.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" placeholder="¿De qué quieres hablar?" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenido</Label>
        <Textarea
          id="content"
          placeholder="Comparte tu experiencia, consejo o pregunta..."
          rows={8}
          {...register('content')}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Publicar'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
