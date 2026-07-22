import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/shared/StarRating'
import { ShareWhatsAppButton } from '@/components/shared/ShareWhatsAppButton'
import { formatRelativeTime } from '@/lib/format'
import { shareCasaReviewText } from '@/lib/share'
import { resourceReviewService } from '@/services/resource-review.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ResourceReview } from '@/types/resource-reviews'

interface ResourceReviewSectionProps {
  resourceId: string
  reviews: ResourceReview[]
  /** Campos de servicio/dueña + fotos (casas/habitaciones) */
  enriched?: boolean
  resourceName?: string
  sharePath?: string
}

const MAX_PHOTOS = 3

export function ResourceReviewSection({
  resourceId,
  reviews,
  enriched = false,
  resourceName,
  sharePath,
}: ResourceReviewSectionProps) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const isMod = profile?.role === 'moderator' || profile?.role === 'admin'
  const fileRef = useRef<HTMLInputElement>(null)

  const myReview = reviews.find((r) => r.author_id === user?.id)
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [body, setBody] = useState(myReview?.body ?? '')
  const [serviceNotes, setServiceNotes] = useState(myReview?.service_notes ?? '')
  const [ownerNotes, setOwnerNotes] = useState(myReview?.owner_notes ?? '')
  const [keepPaths, setKeepPaths] = useState<string[]>(
    () => myReview?.photos?.map((p) => p.storage_path) ?? [],
  )
  const [keepPreviews, setKeepPreviews] = useState<{ path: string; url?: string }[]>(
    () =>
      myReview?.photos?.map((p) => ({ path: p.storage_path, url: p.url })) ?? [],
  )
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setRating(myReview?.rating ?? 0)
    setBody(myReview?.body ?? '')
    setServiceNotes(myReview?.service_notes ?? '')
    setOwnerNotes(myReview?.owner_notes ?? '')
    setKeepPaths(myReview?.photos?.map((p) => p.storage_path) ?? [])
    setKeepPreviews(myReview?.photos?.map((p) => ({ path: p.storage_path, url: p.url })) ?? [])
    setNewFiles([])
    setNewPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u))
      return []
    })
  }, [myReview?.id, myReview?.rating, myReview?.body, myReview?.service_notes, myReview?.owner_notes])

  useEffect(() => {
    return () => {
      newPreviews.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [newPreviews])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['resource-reviews', resourceId] })
    queryClient.invalidateQueries({ queryKey: ['resource', resourceId] })
  }

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const review = await resourceReviewService.upsertReview(resourceId, user!.id, {
        rating,
        body: body || null,
        service_notes: enriched ? serviceNotes || null : null,
        owner_notes: enriched ? ownerNotes || null : null,
      })
      if (enriched) {
        await resourceReviewService.replacePhotos(review.id, keepPaths, newFiles)
      }
      return review
    },
    onSuccess: () => {
      setFormError(null)
      setNewFiles([])
      setNewPreviews((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u))
        return []
      })
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => resourceReviewService.deleteReview(reviewId),
    onSuccess: invalidate,
  })

  const totalPhotos = keepPaths.length + newFiles.length

  const handleAddFiles = (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_PHOTOS - totalPhotos
    if (room <= 0) {
      setFormError('Máximo 3 fotos por reseña')
      return
    }
    const incoming = Array.from(files).slice(0, room)
    const urls = incoming.map((f) => URL.createObjectURL(f))
    setNewFiles((prev) => [...prev, ...incoming])
    setNewPreviews((prev) => [...prev, ...urls])
    setFormError(null)
  }

  const removeKeep = (path: string) => {
    setKeepPaths((prev) => prev.filter((p) => p !== path))
    setKeepPreviews((prev) => prev.filter((p) => p.path !== path))
  }

  const removeNew = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]!)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = () => {
    if (rating < 0 || rating > 5) {
      setFormError('Elige una puntuación de 0 a 5')
      return
    }
    if (enriched) {
      if (!serviceNotes.trim()) {
        setFormError('Cuéntanos cómo fue el servicio')
        return
      }
      if (!ownerNotes.trim()) {
        setFormError('Cuéntanos cómo fue el trato con la dueña')
        return
      }
    } else if (rating < 1) {
      setFormError('Elige una puntuación')
      return
    }
    upsertMutation.mutate()
  }

  if (!user) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Inicia sesión para ver y dejar reseñas.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Sé la primera en dejar una reseña.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const canDelete = review.author_id === user?.id || isMod
            return (
              <div key={review.id} className="flex gap-3">
                {review.author && (
                  <Link to={`/profile/${review.author.alias}`}>
                    <Avatar src={review.author.avatar_url} alias={review.author.alias} size="sm" />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {review.author ? (
                      <Link
                        to={`/profile/${review.author.alias}`}
                        className="text-sm font-semibold hover:text-accent"
                      >
                        @{review.author.alias}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">@—</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(review.created_at)}
                    </span>
                    {sharePath && resourceName && (
                      <ShareWhatsAppButton
                        size="sm"
                        variant="ghost"
                        label="Compartir con alguna amiga"
                        className="ml-auto h-8 px-2 text-[11px]"
                        text={shareCasaReviewText({
                          isFuna: review.rating <= 2,
                          houseName: resourceName,
                          rating: review.rating,
                          path: `${sharePath}#reseña-${review.id}`,
                        })}
                      />
                    )}
                  </div>
                  <StarRating value={review.rating} size="sm" className="mt-1" />
                  {enriched && review.service_notes && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Servicio
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{review.service_notes}</p>
                    </div>
                  )}
                  {enriched && review.owner_notes && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Relación con la dueña
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{review.owner_notes}</p>
                    </div>
                  )}
                  {review.body && (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{review.body}</p>
                  )}
                  {review.photos && review.photos.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {review.photos.map((photo) =>
                        photo.url ? (
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt=""
                            className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          />
                        ) : null,
                      )}
                    </div>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 gap-1 text-xs text-destructive"
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">{myReview ? 'Edita tu reseña' : 'Deja tu reseña'}</p>
        <div>
          <Label className="text-xs text-muted-foreground">Puntuación (0 a 5)</Label>
          <StarRating
            value={rating}
            onChange={setRating}
            allowZero={enriched}
            className="mt-1"
          />
        </div>

        {enriched && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="service_notes">¿Cómo fue el servicio / la estadía?</Label>
              <Textarea
                id="service_notes"
                placeholder="Limpieza, seguridad, comodidad, reglas de la casa…"
                rows={3}
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_notes">¿Cómo fue el trato con la dueña?</Label>
              <Textarea
                id="owner_notes"
                placeholder="Comunicación, respeto, confianza, problemas…"
                rows={3}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
              />
            </div>
          </>
        )}

        <Textarea
          placeholder={enriched ? 'Comentario extra (opcional)' : 'Cuéntanos tu experiencia (opcional)'}
          rows={enriched ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {enriched && (
          <div className="space-y-2">
            <Label>Fotos (máx. {MAX_PHOTOS})</Label>
            <div className="flex flex-wrap gap-2">
              {keepPreviews.map((p) => (
                <div key={p.path} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  {p.url && <img src={p.url} alt="" className="h-full w-full object-cover" />}
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                    onClick={() => removeKeep(p.path)}
                    aria-label="Quitar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {newPreviews.map((url, i) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                    onClick={() => removeNew(i)}
                    aria-label="Quitar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {totalPhotos < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Agregar</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button size="sm" onClick={handleSubmit} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {myReview ? 'Actualizar reseña' : 'Publicar reseña'}
        </Button>
      </div>
    </div>
  )
}
