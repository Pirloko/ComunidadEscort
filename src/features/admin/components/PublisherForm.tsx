import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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

  useEffect(() => {
    if (publisher) {
      reset({
        name: publisher.name,
        whatsapp: publisher.whatsapp,
        note: publisher.note ?? '',
        is_active: publisher.is_active,
        sort_order: publisher.sort_order,
      })
    }
  }, [publisher, reset])

  const saveMutation = useMutation({
    mutationFn: (data: PublisherFormData) => {
      const payload = {
        name: data.name,
        whatsapp: data.whatsapp,
        note: data.note || null,
        is_active: data.is_active,
        sort_order: data.sort_order,
      }
      return isEdit
        ? publisherService.update(publisher!.id, payload)
        : publisherService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publishers'] })
      queryClient.invalidateQueries({ queryKey: ['recommended-publishers'] })
      onClose()
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <h3 className="font-semibold">
        {isEdit ? 'Editar publicador' : 'Nuevo publicador'}
      </h3>

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
        <p className="text-xs text-muted-foreground">Menor número aparece más arriba en el home.</p>
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
