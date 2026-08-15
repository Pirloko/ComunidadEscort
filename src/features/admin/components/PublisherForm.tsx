import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  publisherFormSchema,
  type PublisherFormData,
} from '@/features/admin/schemas/publisher.schema'
import { publisherService } from '@/services/publisher.service'
import type { RecommendedPublisher } from '@/types/admin'

interface PublisherFormProps {
  publisher?: RecommendedPublisher | null
  onClose: () => void
}

export function PublisherForm({ publisher, onClose }: PublisherFormProps) {
  const queryClient = useQueryClient()
  const isEdit = !!publisher
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(publisher?.logo_url ?? null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PublisherFormData>({
    resolver: zodResolver(publisherFormSchema),
    defaultValues: {
      name: '',
      whatsapp: '',
      note: '',
      is_active: true,
      sort_order: 0,
    },
  })

  const isActive = watch('is_active')
  const nameWatch = watch('name')

  useEffect(() => {
    if (publisher) {
      reset({
        name: publisher.name,
        whatsapp: publisher.whatsapp,
        note: publisher.note ?? '',
        is_active: publisher.is_active,
        sort_order: publisher.sort_order,
      })
      setLogoPreview(publisher.logo_url)
      setLogoFile(null)
      setRemoveLogo(false)
    }
  }, [publisher, reset])

  const saveMutation = useMutation({
    mutationFn: async (data: PublisherFormData) => {
      const payload = {
        name: data.name,
        whatsapp: data.whatsapp,
        note: data.note || null,
        is_active: data.is_active,
        sort_order: data.sort_order,
      }

      let saved = isEdit
        ? await publisherService.update(publisher!.id, payload)
        : await publisherService.create(payload)

      if (logoFile) {
        saved = await publisherService.uploadLogo(saved.id, logoFile)
      } else if (isEdit && removeLogo && publisher?.logo_url) {
        saved = await publisherService.removeLogo(saved.id)
      }

      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] })
      queryClient.invalidateQueries({ queryKey: ['recommended-publishers'] })
      onClose()
    },
  })

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setRemoveLogo(false)
    setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <form
      onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <h3 className="font-semibold">
        {isEdit ? 'Editar publicador' : 'Nuevo publicador'}
      </h3>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar
            src={removeLogo ? null : logoPreview}
            alias={nameWatch || publisher?.name || 'P'}
            size="lg"
            className="h-16 w-16 border border-white/10"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            onClick={() => fileRef.current?.click()}
            aria-label="Subir logo"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Logo (opcional)</p>
          <p className="text-xs text-muted-foreground">
            Se muestra en círculo como foto de WhatsApp. JPG, PNG o WebP · máx. 2 MB.
          </p>
          {(logoPreview || publisher?.logo_url) && !removeLogo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-0 text-destructive"
              onClick={() => {
                setLogoFile(null)
                setRemoveLogo(true)
                setLogoPreview(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
            >
              Quitar logo
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickLogo}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher-name">Nombre</Label>
        <Input id="publisher-name" {...register('name')} placeholder="Publicaciones Norte" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher-whatsapp">WhatsApp</Label>
        <Input
          id="publisher-whatsapp"
          {...register('whatsapp')}
          placeholder="+56 9 1234 5678"
          inputMode="tel"
        />
        {errors.whatsapp && (
          <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher-note">Nota (opcional)</Label>
        <Input
          id="publisher-note"
          {...register('note')}
          placeholder="Chimbis · Skokka"
        />
        {errors.note && (
          <p className="text-sm text-destructive">{errors.note.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="publisher-sort">Orden</Label>
        <Input
          id="publisher-sort"
          type="number"
          min={0}
          {...register('sort_order', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          En el home el orden es aleatorio; este valor solo ordena el listado admin.
        </p>
        {errors.sort_order && (
          <p className="text-sm text-destructive">{errors.sort_order.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={(v) => setValue('is_active', v)}
        />
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
          {isEdit ? 'Guardar' : 'Crear publicador'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
