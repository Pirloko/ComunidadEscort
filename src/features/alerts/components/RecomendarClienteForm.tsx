import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/shared/StarRating'
import {
  recomendarClienteSchema,
  type RecomendarClienteFormData,
} from '@/features/alerts/schemas/alert.schema'
import { alertService } from '@/services/alert.service'
import { useCity } from '@/features/cities/context/CityContext'
import type { Alert } from '@/types/alerts'

interface RecomendarClienteFormProps {
  authorId: string
  onSuccess: (alert: Alert) => void
}

export function RecomendarClienteForm({ authorId, onSuccess }: RecomendarClienteFormProps) {
  const navigate = useNavigate()
  const { cities, selectedCityId } = useCity()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecomendarClienteFormData>({
    resolver: zodResolver(recomendarClienteSchema),
    defaultValues: {
      rating: 5,
      city_mode: 'list',
      city_id: selectedCityId ?? '',
      city_other: '',
      treatment_notes: '',
      hygiene_notes: '',
    },
  })

  const cityMode = watch('city_mode')
  const rating = watch('rating')

  const onSubmit = async (data: RecomendarClienteFormData) => {
    setError(null)
    try {
      const description = `Trato: ${data.treatment_notes.trim()}\n\nHigiene: ${data.hygiene_notes.trim()}`
      const alert = await alertService.createAlert(authorId, {
        report_kind: 'recomendar',
        category: 'recomendacion',
        title: `Recomendación — ${data.client_number.trim()}`,
        description,
        client_number: data.client_number.trim(),
        rating: data.rating,
        treatment_notes: data.treatment_notes.trim(),
        hygiene_notes: data.hygiene_notes.trim(),
        city_id: data.city_mode === 'list' ? data.city_id : null,
        city_other: data.city_mode === 'other' ? data.city_other?.trim() : null,
      })
      onSuccess(alert)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la recomendación')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-900 dark:text-emerald-200">
            Tu recomendación será revisada antes de publicarse. Ayuda a otras compañeras a
            moverse con más confianza.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

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
        <Label>Reseña (0 a 5 estrellas)</Label>
        <StarRating
          value={rating}
          onChange={(v) => setValue('rating', v, { shouldValidate: true })}
          allowZero
        />
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment_notes">¿Cómo fue el trato con el cliente?</Label>
        <Textarea
          id="treatment_notes"
          placeholder="Respeto, puntualidad, comunicación…"
          rows={3}
          {...register('treatment_notes')}
        />
        {errors.treatment_notes && (
          <p className="text-sm text-destructive">{errors.treatment_notes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hygiene_notes">¿Cómo fue la higiene?</Label>
        <Textarea
          id="hygiene_notes"
          placeholder="Aseo personal, uso de protección, cuidado del espacio…"
          rows={3}
          {...register('hygiene_notes')}
        />
        {errors.hygiene_notes && (
          <p className="text-sm text-destructive">{errors.hygiene_notes.message}</p>
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

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar recomendación
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
