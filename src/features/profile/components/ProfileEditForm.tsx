import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/features/profile/components/AvatarUpload'
import { editProfileSchema, type EditProfileFormData } from '@/features/profile/schemas/profile.schema'
import { cityService } from '@/services/city.service'
import { profileService } from '@/services/profile.service'
import type { City, Profile } from '@/types/database'

interface ProfileEditFormProps {
  profile: Profile
  cities: City[]
  onSuccess: (profile: Profile) => void
}

export function ProfileEditForm({ profile, cities, onSuccess }: ProfileEditFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      alias: profile.alias,
      city_id: profile.city_id ?? '',
      description: profile.description ?? '',
    },
  })

  const onSubmit = async (data: EditProfileFormData) => {
    setError(null)

    try {
      if (data.alias.toLowerCase() !== profile.alias.toLowerCase()) {
        const available = await cityService.isAliasAvailable(data.alias)
        if (!available) {
          setError('Este alias ya está en uso.')
          return
        }
      }

      const updated = await profileService.updateProfile(profile.id, {
        alias: data.alias,
        city_id: data.city_id || null,
        description: data.description || null,
        avatar_url: avatarUrl,
      })

      onSuccess(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AvatarUpload
        userId={profile.id}
        alias={profile.alias}
        currentUrl={avatarUrl}
        onUploaded={setAvatarUrl}
      />

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="alias">Alias</Label>
        <Input id="alias" {...register('alias')} />
        {errors.alias && <p className="text-sm text-destructive">{errors.alias.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city_id">Ciudad</Label>
        <select
          id="city_id"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('city_id')}
        >
          <option value="">Sin asignar</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {errors.city_id && <p className="text-sm text-destructive">{errors.city_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Cuéntanos un poco sobre ti..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  )
}
