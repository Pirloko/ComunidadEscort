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
import { normalizePhoneChile } from '@/lib/phone'
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
    mode: 'onBlur',
    defaultValues: {
      category: initialData?.category ?? 'otros',
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
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        google_maps_url: data.google_maps_url || null,
        website: data.website || null,
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        whatsapp_phone: data.whatsapp_phone ? normalizePhoneChile(data.whatsapp_phone) : null,
      }

      const resource = isEditing
        ? await resourceService.updateResource(initialData.id, payload)
        : await resourceService.createResource(authorId, { ...payload, city_id: cityId })

      onSuccess(resource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el dato')
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

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input id="phone" placeholder="+56 9 ..." {...register('phone')} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Ubicación</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección (opcional)</Label>
          <Input id="address" placeholder="Calle, comuna..." {...register('address')} />
          {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
        </div>
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
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Redes</h3>
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
        <div className="space-y-2">
          <Label htmlFor="whatsapp_phone">WhatsApp (opcional)</Label>
          <Input id="whatsapp_phone" placeholder="+56 9 1234 5678" {...register('whatsapp_phone')} />
          {errors.whatsapp_phone && (
            <p className="text-sm text-destructive">{errors.whatsapp_phone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Celular chileno: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678).
          </p>
        </div>
      </div>

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
