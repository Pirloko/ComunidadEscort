import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { resourceSchema, type ResourceFormData } from '@/features/resources/schemas/resource.schema'
import { RESOURCE_CATEGORIES } from '@/lib/resources'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types/resources'

interface ResourceFormProps {
  cityId: string
  authorId: string
  initialData?: Resource
  onSuccess: (resource: Resource) => void
}

export function ResourceForm({ cityId, authorId, initialData, onSuccess }: ResourceFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData

  const categories = RESOURCE_CATEGORIES.filter((c) => c.value !== 'all')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      category: initialData?.category ?? 'otros',
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      phone: initialData?.phone ?? '',
      address: initialData?.address ?? '',
      website: initialData?.website ?? '',
    },
  })

  const onSubmit = async (data: ResourceFormData) => {
    setError(null)
    try {
      const payload = {
        category: data.category,
        name: data.name,
        description: data.description || null,
        phone: data.phone || null,
        address: data.address || null,
        website: data.website || null,
      }

      const resource = isEditing
        ? await resourceService.updatePendingResource(initialData.id, payload)
        : await resourceService.createResource(authorId, { ...payload, city_id: cityId })

      onSuccess(resource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el recurso')
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
        <Label htmlFor="name">Nombre del servicio</Label>
        <Input id="name" placeholder="Ej: Farmacia Ahumada Express" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="¿Por qué lo recomiendas? Horarios, cobertura..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input id="phone" placeholder="+56 9 ..." {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Sitio web (opcional)</Label>
          <Input id="website" placeholder="https://..." {...register('website')} />
          {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección (opcional)</Label>
        <Input id="address" placeholder="Calle, comuna..." {...register('address')} />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Agregar recurso'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
