import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Info, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { funarClienteSchema, type FunarClienteFormData } from '@/features/alerts/schemas/alert.schema'
import { FUNAR_CATEGORIES } from '@/lib/alerts'
import { alertService } from '@/services/alert.service'
import { useCity } from '@/features/cities/context/CityContext'
import type { Alert } from '@/types/alerts'

interface FunarClienteFormProps {
  authorId: string
  onSuccess: (alert: Alert) => void
}

export function FunarClienteForm({ authorId, onSuccess }: FunarClienteFormProps) {
  const navigate = useNavigate()
  const { cities, selectedCityId } = useCity()
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FunarClienteFormData>({
    resolver: zodResolver(funarClienteSchema),
    defaultValues: {
      category: 'incidente_seguridad',
      category_other: '',
      city_mode: 'list',
      city_id: selectedCityId ?? '',
      city_other: '',
    },
  })

  const category = watch('category')
  const cityMode = watch('city_mode')

  const clearMediaPreviews = () => {
    imagePreviews.forEach((u) => URL.revokeObjectURL(u))
    if (videoPreview) URL.revokeObjectURL(videoPreview)
  }

  const onSubmit = async (data: FunarClienteFormData) => {
    setError(null)
    try {
      const alert = await alertService.createAlert(authorId, {
        report_kind: 'funar',
        category: data.category,
        category_other: data.category === 'otro' ? data.category_other?.trim() : null,
        title: data.title,
        description: data.description,
        client_number: data.client_number.trim(),
        city_id: data.city_mode === 'list' ? data.city_id : null,
        city_other: data.city_mode === 'other' ? data.city_other?.trim() : null,
      })
      if (images.length > 0 || video) {
        await alertService.uploadAlertMedia(alert.id, { images, video })
      }
      clearMediaPreviews()
      onSuccess(alert)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Los reportes <strong>no se publican automáticamente</strong>. Una moderadora
            revisará tu funa antes de que sea visible para la comunidad.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">Tipo de alerta</Label>
        <select
          id="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('category')}
        >
          {FUNAR_CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {category === 'otro' && (
        <div className="space-y-2">
          <Label htmlFor="category_other">¿Cuál otro?</Label>
          <Input
            id="category_other"
            placeholder="Describe el tipo de alerta"
            {...register('category_other')}
          />
          {errors.category_other && (
            <p className="text-sm text-destructive">{errors.category_other.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" placeholder="Describe brevemente la situación" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_number">Número del cliente</Label>
        <Input
          id="client_number"
          placeholder="+569XXXXXXXX o el contacto que usó"
          {...register('client_number')}
        />
        {errors.client_number && (
          <p className="text-sm text-destructive">{errors.client_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">¿Qué fue lo que pasó?</Label>
        <Textarea
          id="description"
          placeholder="Cuenta con detalle lo ocurrido (sin datos personales sensibles de otras compañeras)…"
          rows={6}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Ciudad / comuna</Label>
        <Controller
          name="city_mode"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={field.value === 'list' ? 'accent' : 'outline'}
                onClick={() => field.onChange('list')}
              >
                Lista
              </Button>
              <Button
                type="button"
                size="sm"
                variant={field.value === 'other' ? 'accent' : 'outline'}
                onClick={() => field.onChange('other')}
              >
                Otra
              </Button>
            </div>
          )}
        />
        {cityMode === 'list' ? (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('city_id')}
          >
            <option value="">Selecciona…</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <Input placeholder="Escribe la ciudad o comuna" {...register('city_other')} />
        )}
        {(errors.city_id || errors.city_other) && (
          <p className="text-sm text-destructive">
            {errors.city_id?.message ?? errors.city_other?.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Fotos (máx. 3)</Label>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((url, i) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                onClick={() => {
                  URL.revokeObjectURL(url)
                  setImages((prev) => prev.filter((_, idx) => idx !== i))
                  setImagePreviews((prev) => prev.filter((_, idx) => idx !== i))
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">Agregar</span>
            </button>
          )}
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const room = 3 - images.length
            const incoming = Array.from(e.target.files ?? []).slice(0, room)
            setImages((prev) => [...prev, ...incoming])
            setImagePreviews((prev) => [
              ...prev,
              ...incoming.map((f) => URL.createObjectURL(f)),
            ])
            e.target.value = ''
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Video (máx. 1, hasta 20 s)</Label>
        {videoPreview ? (
          <div className="relative">
            <video src={videoPreview} controls className="max-h-48 w-full rounded-lg border" />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                if (videoPreview) URL.revokeObjectURL(videoPreview)
                setVideo(null)
                setVideoPreview(null)
              }}
            >
              Quitar video
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => videoRef.current?.click()}>
            Subir video
          </Button>
        )}
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              const url = URL.createObjectURL(file)
              const v = document.createElement('video')
              v.preload = 'metadata'
              await new Promise<void>((resolve, reject) => {
                v.onloadedmetadata = () => resolve()
                v.onerror = () => reject(new Error('Video inválido'))
                v.src = url
              })
              if (v.duration > 20.05) {
                URL.revokeObjectURL(url)
                setError('El video no puede superar 20 segundos')
                return
              }
              if (videoPreview) URL.revokeObjectURL(videoPreview)
              setVideo(file)
              setVideoPreview(url)
              setError(null)
            } catch {
              setError('No se pudo leer el video')
            }
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar funa
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
