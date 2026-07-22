import { supabase } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-webp'
import type {
  ResourceReview,
  ResourceReviewPhoto,
  UpsertResourceReviewInput,
} from '@/types/resource-reviews'

const REVIEW_PHOTOS_BUCKET = 'review-photos'
const SIGNED_URL_TTL_SEC = 3600

const RESOURCE_REVIEW_SELECT = `
  id, resource_id, author_id, rating, body, service_notes, owner_notes, created_at,
  author:profiles!author_id(id, alias, avatar_url),
  photos:resource_review_photos(id, review_id, storage_path, sort_order, created_at)
`

const RESOURCE_REVIEW_FEED_SELECT = `
  id, resource_id, author_id, rating, body, service_notes, owner_notes, created_at,
  author:profiles!author_id(id, alias, avatar_url),
  resource:resources!resource_id(
    id, name, category,
    city:cities!city_id(id, name, slug)
  )
`

async function signReviewPhotos(
  photos: ResourceReviewPhoto[] | null | undefined,
): Promise<ResourceReviewPhoto[]> {
  if (!photos?.length) return []
  const signed: ResourceReviewPhoto[] = []
  for (const photo of photos) {
    const { data } = await supabase.storage
      .from(REVIEW_PHOTOS_BUCKET)
      .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SEC)
    signed.push({ ...photo, url: data?.signedUrl })
  }
  return signed.sort((a, b) => a.sort_order - b.sort_order)
}

async function enrichReview(review: ResourceReview): Promise<ResourceReview> {
  return {
    ...review,
    photos: await signReviewPhotos(review.photos),
  }
}

export const resourceReviewService = {
  async getReviewsByResource(resourceId: string): Promise<ResourceReview[]> {
    const { data, error } = await supabase
      .from('resource_reviews')
      .select(RESOURCE_REVIEW_SELECT)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []) as unknown as ResourceReview[]
    return Promise.all(rows.map(enrichReview))
  },

  /** Reseñas recientes de habitaciones (para el muro del feed). */
  async getRecentHabitacionReviews(limit = 10): Promise<ResourceReview[]> {
    const { data, error } = await supabase
      .from('resource_reviews')
      .select(RESOURCE_REVIEW_FEED_SELECT)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 3, 30))

    if (error) throw error
    const rows = ((data ?? []) as unknown as ResourceReview[]).filter(
      (r) => r.resource?.category === 'habitaciones_escort',
    )
    return rows.slice(0, limit)
  },

  async upsertReview(
    resourceId: string,
    authorId: string,
    input: UpsertResourceReviewInput,
  ): Promise<ResourceReview> {
    const { data, error } = await supabase
      .from('resource_reviews')
      .upsert(
        {
          resource_id: resourceId,
          author_id: authorId,
          rating: input.rating,
          body: input.body ?? null,
          service_notes: input.service_notes ?? null,
          owner_notes: input.owner_notes ?? null,
        },
        { onConflict: 'resource_id,author_id' },
      )
      .select(RESOURCE_REVIEW_SELECT)
      .single()

    if (error) throw error
    return enrichReview(data as unknown as ResourceReview)
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { data: photos } = await supabase
      .from('resource_review_photos')
      .select('storage_path')
      .eq('review_id', reviewId)

    const paths = (photos ?? []).map((p) => p.storage_path as string)
    if (paths.length > 0) {
      await supabase.storage.from(REVIEW_PHOTOS_BUCKET).remove(paths)
    }

    const { error } = await supabase.from('resource_reviews').delete().eq('id', reviewId)
    if (error) throw error
  },

  /**
   * Reemplaza las fotos de la reseña (máx. 3).
   * `keepPaths` = paths que se mantienen; `newFiles` = archivos nuevos a subir.
   */
  async replacePhotos(
    reviewId: string,
    keepPaths: string[],
    newFiles: File[],
  ): Promise<ResourceReviewPhoto[]> {
    if (keepPaths.length + newFiles.length > 3) {
      throw new Error('Máximo 3 fotos por reseña')
    }

    const { data: existing, error: listError } = await supabase
      .from('resource_review_photos')
      .select('id, storage_path')
      .eq('review_id', reviewId)

    if (listError) throw listError

    const toRemove = (existing ?? []).filter((p) => !keepPaths.includes(p.storage_path))
    if (toRemove.length > 0) {
      await supabase.storage
        .from(REVIEW_PHOTOS_BUCKET)
        .remove(toRemove.map((p) => p.storage_path))
      const { error: delError } = await supabase
        .from('resource_review_photos')
        .delete()
        .in(
          'id',
          toRemove.map((p) => p.id),
        )
      if (delError) throw delError
    }

    const uploadedPaths: string[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const webpFile = await convertImageToWebp(newFiles[i], { maxOutputBytes: 2_500_000 })
      const path = `${reviewId}/${crypto.randomUUID()}.webp`
      const { error: upError } = await supabase.storage
        .from(REVIEW_PHOTOS_BUCKET)
        .upload(path, webpFile, { contentType: 'image/webp', upsert: false })
      if (upError) throw upError
      uploadedPaths.push(path)
    }

    const finalPaths = [...keepPaths, ...uploadedPaths]
    // Reordenar: borrar filas restantes y reinsertar con sort_order
    const { error: clearError } = await supabase
      .from('resource_review_photos')
      .delete()
      .eq('review_id', reviewId)
    if (clearError) throw clearError

    if (finalPaths.length > 0) {
      const rows = finalPaths.map((storage_path, sort_order) => ({
        review_id: reviewId,
        storage_path,
        sort_order,
      }))
      const { error: insertError } = await supabase.from('resource_review_photos').insert(rows)
      if (insertError) throw insertError
    }

    const { data: photos, error: fetchError } = await supabase
      .from('resource_review_photos')
      .select('id, review_id, storage_path, sort_order, created_at')
      .eq('review_id', reviewId)
      .order('sort_order')

    if (fetchError) throw fetchError
    return signReviewPhotos((photos ?? []) as ResourceReviewPhoto[])
  },
}
