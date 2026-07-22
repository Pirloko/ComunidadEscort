import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { privacySettingsSchema, type PrivacySettingsFormData } from '@/features/profile/schemas/profile.schema'
import { profileService } from '@/services/profile.service'
import type { Profile } from '@/types/database'

interface PrivacySettingsFormProps {
  profile: Profile
  onSuccess: (profile: Profile) => void
}

export function PrivacySettingsForm({ profile, onSuccess }: PrivacySettingsFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<PrivacySettingsFormData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      show_description: profile.privacy_settings.show_description,
    },
  })

  const values = watch()

  const onSubmit = async (data: PrivacySettingsFormData) => {
    setError(null)
    setSuccess(false)
    try {
      const updated = await profileService.updateProfile(profile.id, {
        privacy_settings: {
          ...profile.privacy_settings,
          ...data,
          show_city: false,
          allow_messages: false,
        },
      })
      onSuccess(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">
          Configuración guardada correctamente.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="show_description">Mostrar descripción</Label>
          <p className="text-sm text-muted-foreground">Tu descripción será visible en tu perfil público.</p>
        </div>
        <Switch
          id="show_description"
          checked={values.show_description}
          onCheckedChange={(v) => setValue('show_description', v, { shouldDirty: true })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar privacidad
      </Button>
    </form>
  )
}
