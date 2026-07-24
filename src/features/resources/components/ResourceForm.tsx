import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { resourceSchema, type ResourceFormData } from '@/features/resources/schemas/resource.schema'
import { RESOURCE_CATEGORIES } from '@/lib/resources'
import { HABITACION_ATTR_LABELS, MAX_HABITACION_PHOTOS } from '@/lib/habitaciones'
import { normalizePhoneChile } from '@/lib/phone'
import { resourceService } from '@/services/resource.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import type { Resource, ResourcePhoto } from '@/types/resources'
import type { ResourceCategory } from '@/types/database'

interface ResourceFormProps {
  cityId: string
  authorId: string
  initialData?: Resource
  /** Fija la categoría (oculta el selector). Útil en admin de casas. */
  forceCategory?: ResourceCategory
  onSuccess: (resource: Resource) => void
}

export function ResourceForm({
  cityId,
  authorId,
  initialData,
  forceCategory,
  onSuccess,
}: ResourceFormProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { cities } = useCity()
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingVideo, setPendingVideo] = useState<File | null>(null)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(
    initialData?.video_url ?? null,
  )
  const [existingPhotos, setExistingPhotos] = useState<ResourcePhoto[]>(
    initialData?.photos ?? [],
  )
  const isEditing = !!initialData
  const isAdmin = profile?.role === 'admin'

  const categories = RESOURCE_CATEGORIES.filter((c) => {
    if (c.value === 'all') return false
    if (c.value === 'habitaciones_escort' && !isAdmin) return false
    return true
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    mode: 'onBlur',
    defaultValues: {
      city_id: initialData?.city_id ?? cityId,
      category: forceCategory ?? initialData?.category ?? 'otros',
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      phone: initialData?.phone ?? '',
      address: initialData?.address ?? '',
      latitude: initialData?.latitude != null ? String(initialData.latitude) : '',
      longitude: initialData?.longitude != null ? String(initialData.longitude) : '',
      google_maps_url: initialData?.google_maps_url ?? '',
      website: initialData?.website ?? '',
      instagram_url: initialData?.instagram_url ?? '',
      facebook_url: initialData?.facebook_url ?? '',
      whatsapp_phone: initialData?.whatsapp_phone ?? '',
      contact_phone: initialData?.contact_phone ?? '',
      is_public: initialData?.is_public ?? forceCategory === 'habitaciones_escort',
      house_rules: initialData?.house_rules ?? '',
      recibe_mujer: initialData?.recibe_mujer ?? true,
      recibe_hombre: initialData?.recibe_hombre ?? false,
      recibe_trans: initialData?.recibe_trans ?? false,
      pide_reserva: initialData?.pide_reserva ?? false,
      pide_referencias: initialData?.pide_referencias ?? false,
      pide_doc_identidad: initialData?.pide_doc_identidad ?? false,
      pide_link_publicacion: initialData?.pide_link_publicacion ?? false,
      acepta_parejas: initialData?.acepta_parejas ?? false,
      recibe_agencias: initialData?.recibe_agencias ?? false,
      tiene_camaras_seguridad: initialData?.tiene_camaras_seguridad ?? false,
      tiene_wifi: initialData?.tiene_wifi ?? false,
      tiene_bano_privado: initialData?.tiene_bano_privado ?? false,
      tiene_extintor: initialData?.tiene_extintor ?? false,
    },
  })

  const category = watch('category')
  const isHabitacion = (forceCategory ?? category) === 'habitaciones_escort'

  const onSubmit = async (data: ResourceFormData) => {
    setError(null)
    try {
      if ((forceCategory ?? data.category) === 'habitaciones_escort' && !isAdmin) {
        throw new Error('Solo administradoras pueden publicar habitaciones para escort.')
      }

      const isHabitacionSubmit = (forceCategory ?? data.category) === 'habitaciones_escort'

      const payload = {
        city_id: data.city_id,
        category: forceCategory ?? data.category,
        name: data.name,
        description: data.description || null,
        phone: data.phone || null,
        address: data.address || null,
        latitude: isHabitacionSubmit ? null : data.latitude ? Number(data.latitude) : null,
        longitude: isHabitacionSubmit ? null : data.longitude ? Number(data.longitude) : null,
        google_maps_url: isHabitacionSubmit ? null : data.google_maps_url || null,
        website: isHabitacionSubmit ? null : data.website || null,
        instagram_url: isHabitacionSubmit ? null : data.instagram_url || null,
        facebook_url: isHabitacionSubmit ? null : data.facebook_url || null,
        whatsapp_phone: data.whatsapp_phone ? normalizePhoneChile(data.whatsapp_phone) : null,
        contact_phone: data.contact_phone ? normalizePhoneChile(data.contact_phone) : null,
        is_public: isHabitacionSubmit ? !!data.is_public : false,
        house_rules: isHabitacionSubmit ? data.house_rules || null : null,
        recibe_mujer: !!data.recibe_mujer,
        recibe_hombre: !!data.recibe_hombre,
        recibe_trans: !!data.recibe_trans,
        pide_reserva: !!data.pide_reserva,
        pide_referencias: !!data.pide_referencias,
        pide_doc_identidad: !!data.pide_doc_identidad,
        pide_link_publicacion: !!data.pide_link_publicacion,
        acepta_parejas: !!data.acepta_parejas,
        recibe_agencias: !!data.recibe_agencias,
        tiene_camaras_seguridad: !!data.tiene_camaras_seguridad,
        tiene_wifi: !!data.tiene_wifi,
        tiene_bano_privado: !!data.tiene_bano_privado,
        tiene_extintor: !!data.tiene_extintor,
      }

      let resource = isEditing
        ? await resourceService.updateResource(initialData.id, payload)
        : await resourceService.createResource(authorId, payload)

      if (isHabitacion && pendingFiles.length > 0) {
        const startOrder = existingPhotos.length
        for (let i = 0; i < pendingFiles.length; i++) {
          await resourceService.uploadResourcePhoto(resource.id, pendingFiles[i], startOrder + i, {
            isPublic: !!data.is_public,
          })
        }
      }

      if (isHabitacion && pendingVideo) {
        resource = await resourceService.uploadResourceVideo(resource.id, pendingVideo, {
          isPublic: !!data.is_public,
        })
        setPendingVideo(null)
        setExistingVideoUrl(resource.video_url)
      }

      if (isHabitacion && (pendingFiles.length > 0 || pendingVideo)) {
        const refreshed = await resourceService.getResourceById(resource.id)
        if (refreshed) {
          resource = refreshed
          setExistingVideoUrl(refreshed.video_url)
        }
      }

      onSuccess(resource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el dato')
    }
  }

  const handleRemoveExistingPhoto = async (photo: ResourcePhoto) => {
    if (!confirm('¿Eliminar esta foto?')) return
    try {
      await resourceService.deleteResourcePhoto(photo.id, photo.url)
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la foto')
    }
  }

  const handleRemoveExistingVideo = async () => {
    if (!initialData?.id || !existingVideoUrl) return
    if (!confirm('¿Eliminar el video?')) return
    try {
      const updated = await resourceService.deleteResourceVideo(initialData.id, existingVideoUrl)
      setExistingVideoUrl(updated.video_url)
      setPendingVideo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el video')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="city_id">Ciudad</Label>
        <select
          id="city_id"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('city_id')}
        >
          <option value="">Selecciona una ciudad</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.city_id && <p className="text-sm text-destructive">{errors.city_id.message}</p>}
      </div>

      {!forceCategory && (
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
          {isHabitacion && (
            <p className="text-xs text-muted-foreground">
              Solo admin publica habitaciones. Marca &quot;Visible en /home&quot; para el listado público.
            </p>
          )}
        </div>
      )}
      {forceCategory === 'habitaciones_escort' && (
        <p className="text-xs text-muted-foreground">
          Habitación para escort. Marca &quot;Visible en /home&quot; si quieres que aparezca en el listado
          público.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{isHabitacion ? 'Nombre del hospedaje' : 'Nombre del servicio'}</Label>
        <Input
          id="name"
          placeholder={isHabitacion ? 'Ej: Depto Providencia centro' : 'Ej: Farmacia Ahumada Express'}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder={
            isHabitacion
              ? 'Ubicación, ambiente, horarios de check-in...'
              : '¿Por qué lo recomiendas? Horarios, cobertura...'
          }
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {!isHabitacion && (
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input id="phone" placeholder="+56 9 ..." {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Ubicación</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección (opcional)</Label>
          <Input id="address" placeholder="Calle, comuna..." {...register('address')} />
          {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
        </div>
        {!isHabitacion && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitud (opcional)</Label>
                <Input id="latitude" type="text" placeholder="-33.4489" {...register('latitude')} />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitud (opcional)</Label>
                <Input id="longitude" type="text" placeholder="-70.6693" {...register('longitude')} />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">Enlace de Google Maps (opcional)</Label>
              <Input
                id="google_maps_url"
                placeholder="https://maps.google.com/..."
                {...register('google_maps_url')}
              />
              {errors.google_maps_url && (
                <p className="text-sm text-destructive">{errors.google_maps_url.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">{isHabitacion ? 'Contacto' : 'Redes y contacto'}</h3>
        {!isHabitacion && (
          <>
            <div className="space-y-2">
              <Label htmlFor="website">Sitio web (opcional)</Label>
              <Input id="website" placeholder="https://..." {...register('website')} />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram (opcional)</Label>
                <Input
                  id="instagram_url"
                  placeholder="https://instagram.com/..."
                  {...register('instagram_url')}
                />
                {errors.instagram_url && (
                  <p className="text-sm text-destructive">{errors.instagram_url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook (opcional)</Label>
                <Input
                  id="facebook_url"
                  placeholder="https://facebook.com/..."
                  {...register('facebook_url')}
                />
                {errors.facebook_url && (
                  <p className="text-sm text-destructive">{errors.facebook_url.message}</p>
                )}
              </div>
            </div>
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_phone">
              WhatsApp {isHabitacion ? '' : '(opcional)'}
            </Label>
            <Input id="whatsapp_phone" placeholder="+56 9 1234 5678" {...register('whatsapp_phone')} />
            {errors.whatsapp_phone && (
              <p className="text-sm text-destructive">{errors.whatsapp_phone.message}</p>
            )}
          </div>
          {isHabitacion && (
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono para llamar (opcional)</Label>
              <Input id="contact_phone" placeholder="+56 9 1234 5678" {...register('contact_phone')} />
              {errors.contact_phone && (
                <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Celular chileno: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678).
        </p>
      </div>

      {isHabitacion && (
        <>
          <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <h3 className="text-sm font-semibold">Habitación — visibilidad y reglas</h3>
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm">Visible en /home público</span>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="house_rules">Observaciones o Reglas del Hospedaje</Label>
              <Textarea
                id="house_rules"
                rows={5}
                placeholder="No hacer fiestas, sin mascotas, horarios..."
                {...register('house_rules')}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Condiciones (Sí / No)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                name="recibe_mujer"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Recibe mujer
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Controller
                name="recibe_hombre"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Recibe hombre
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Controller
                name="recibe_trans"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Recibe trans
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              {HABITACION_ATTR_LABELS.map(({ key, label }) => (
                <Controller
                  key={key}
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center justify-between gap-2 text-sm">
                      <span className="pr-2">{label}</span>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </label>
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Fotos</h3>
            {existingPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative h-20 w-24 overflow-hidden rounded-md">
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(photo)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      aria-label="Eliminar foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={existingPhotos.length + pendingFiles.length >= MAX_HABITACION_PHOTOS}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                const slots = Math.max(0, MAX_HABITACION_PHOTOS - existingPhotos.length)
                setPendingFiles((prev) => [...prev, ...files].slice(0, slots))
                e.target.value = ''
              }}
            />
            {pendingFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingFiles.length} foto(s) pendiente(s) de subir al guardar.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WebP — se convierten a WebP con marca Comunidadescort (máx.{' '}
              {MAX_HABITACION_PHOTOS} fotos, ~2,5 MB c/u).
            </p>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Video (opcional, máximo 1)</h3>
            {existingVideoUrl && !pendingVideo && (
              <div className="space-y-2">
                <video
                  src={existingVideoUrl}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-56 w-full rounded-lg border bg-black"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void handleRemoveExistingVideo()}>
                  <X className="h-3.5 w-3.5" />
                  Quitar video
                </Button>
              </div>
            )}
            {pendingVideo && (
              <p className="text-xs text-muted-foreground">
                Video pendiente: {pendingVideo.name} (se sube al guardar).
              </p>
            )}
            <Input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setPendingVideo(file)
                e.target.value = ''
              }}
            />
            <p className="text-xs text-muted-foreground">
              MP4, WebM o MOV — máx. 50 MB y 60 segundos. Reemplaza el video anterior si ya había uno.
            </p>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Agregar dato'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
