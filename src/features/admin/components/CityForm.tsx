import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cityFormSchema, type CityFormData } from '@/features/admin/schemas/city.schema'
import { cityService } from '@/services/city.service'
import type { AdminCity } from '@/types/admin'

interface CityFormProps {
  city?: AdminCity | null
  onClose: () => void
}

export function CityForm({ city, onClose }: CityFormProps) {
  const queryClient = useQueryClient()
  const isEdit = !!city

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => cityService.getRegions(),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CityFormData>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      region_id: '',
      is_active: true,
    },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (city) {
      reset({
        name: city.name,
        slug: city.slug,
        region_id: city.region_id,
        is_active: city.is_active,
      })
    }
  }, [city, reset])

  const saveMutation = useMutation({
    mutationFn: (data: CityFormData) =>
      isEdit
        ? cityService.updateCity(city!.id, data)
        : cityService.createCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      onClose()
    },
  })

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <form
      onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <h3 className="font-semibold">{isEdit ? 'Editar ciudad' : 'Nueva ciudad'}</h3>

      <div className="space-y-2">
        <Label htmlFor="city-name">Nombre</Label>
        <Input
          id="city-name"
          {...register('name')}
          onBlur={(e) => {
            if (!isEdit && !watch('slug')) {
              setValue('slug', slugify(e.target.value))
            }
          }}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city-slug">Slug (URL)</Label>
        <Input id="city-slug" {...register('slug')} placeholder="vina-del-mar" />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city-region">Región</Label>
        <select
          id="city-region"
          {...register('region_id')}
          className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Seleccionar región</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.region_id && (
          <p className="text-sm text-destructive">{errors.region_id.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={(v) => setValue('is_active', v)}
        />
        <span className="text-sm">Ciudad activa (visible en registro)</span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear ciudad'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
