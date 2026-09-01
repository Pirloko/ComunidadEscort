import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  bannerFormSchema,
  type BannerFormData,
} from '@/features/admin/schemas/banner.schema'
import { bannerService } from '@/services/banner.service'
import type { HomeBanner } from '@/types/admin'

interface BannerFormProps {
  banner?: HomeBanner | null
  onClose: () => void
}

export function BannerForm({ banner, onClose }: BannerFormProps) {
  const queryClient = useQueryClient()
  const isEdit = !!banner
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(banner?.image_url ?? null)
  const [removeImage, setRemoveImage] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: '',
      link_url: '',
      is_active: true,
      sort_order: 0,
    },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (banner) {
      reset({
        title: banner.title,
        link_url: banner.link_url ?? '',
        is_active: banner.is_active,
        sort_order: banner.sort_order,
      })
      setImagePreview(banner.image_url)
      setImageFile(null)
      setRemoveImage(false)
    }
  }, [banner, reset])

  const saveMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      const payload = {
        title: data.title,
        link_url: data.link_url?.trim() || null,
        is_active: data.is_active,
        sort_order: data.sort_order,
      }

      if (!isEdit && !imageFile) {
        throw new Error('Debes subir una imagen para el banner.')
      }

      let saved = isEdit
        ? await bannerService.update(banner!.id, payload)
        : await bannerService.create(payload)

      if (imageFile) {
        saved = await bannerService.uploadImage(saved.id, imageFile)
      } else if (isEdit && removeImage && banner?.image_url) {
        saved = await bannerService.removeImage(saved.id)
      }

      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      queryClient.invalidateQueries({ queryKey: ['home-banners'] })
      onClose()
    },
  })

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setRemoveImage(false)
    setImagePreview(URL.createObjectURL(file))
  }

  return (
    <form
      onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <h3 className="font-semibold">{isEdit ? 'Editar banner' : 'Nuevo banner'}</h3>

      <div className="space-y-2">
        <Label>Imagen del banner</Label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative block w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-muted/30 transition hover:border-accent/40"
        >
          {imagePreview && !removeImage ? (
            <img
              src={imagePreview}
              alt="Vista previa"
              className="aspect-[2/1] w-full bg-[#0a0a0c] object-contain object-center"
            />
          ) : (
            <div className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Camera className="h-8 w-8 opacity-60" />
              <span className="text-sm">Subir imagen (JPG, PNG o WebP · máx. 3 MB)</span>
            </div>
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          Medida recomendada: <strong>1200 × 600 px</strong> (proporción 2:1, horizontal).
          En móvil y escritorio se muestra completo, sin recortes.
        </p>
        {(imagePreview || banner?.image_url) && !removeImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-0 text-destructive"
            onClick={() => {
              setImageFile(null)
              setRemoveImage(true)
              setImagePreview(null)
              if (fileRef.current) fileRef.current.value = ''
            }}
          >
            Quitar imagen
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickImage}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-title">Título (texto alternativo)</Label>
        <Input id="banner-title" {...register('title')} placeholder="Promo verano 2026" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-link">Enlace al hacer clic (opcional)</Label>
        <Input
          id="banner-link"
          {...register('link_url')}
          placeholder="https://ejemplo.cl"
          inputMode="url"
        />
        {errors.link_url && (
          <p className="text-sm text-destructive">{errors.link_url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-sort">Orden</Label>
        <Input
          id="banner-sort"
          type="number"
          min={0}
          {...register('sort_order', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Menor número = aparece primero en el carrusel.
        </p>
        {errors.sort_order && (
          <p className="text-sm text-destructive">{errors.sort_order.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
        <span className="text-sm">Activo (visible en el home)</span>
      </label>

      {saveMutation.isError && (
        <p className="text-sm text-destructive">
          {(saveMutation.error as Error)?.message ?? 'No se pudo guardar'}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear banner'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
