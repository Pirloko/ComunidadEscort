import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createAlertSchema, type CreateAlertFormData } from '@/features/alerts/schemas/alert.schema'
import { ALERT_CATEGORIES } from '@/lib/alerts'
import { alertService } from '@/services/alert.service'
import type { Alert } from '@/types/alerts'

interface AlertFormProps {
  cityId: string
  authorId: string
  onSuccess: (alert: Alert) => void
}

export function AlertForm({ cityId, authorId, onSuccess }: AlertFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const categories = ALERT_CATEGORIES.filter((c) => c.value !== 'all')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAlertFormData>({ resolver: zodResolver(createAlertSchema) })

  const onSubmit = async (data: CreateAlertFormData) => {
    setError(null)
    try {
      const alert = await alertService.createAlert(authorId, {
        city_id: cityId,
        category: data.category,
        title: data.title,
        description: data.description,
        location_detail: data.location_detail || undefined,
        report_kind: 'funar',
      })
      onSuccess(alert)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la alerta')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Las alertas <strong>no se publican automáticamente</strong>. Una moderadora revisará
            tu reporte antes de que sea visible para la comunidad.
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
        <Label htmlFor="title">Título</Label>
        <Input id="title" placeholder="Describe brevemente la situación" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción detallada</Label>
        <Textarea
          id="description"
          placeholder="Incluye detalles útiles para la comunidad (sin datos personales sensibles)..."
          rows={6}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_detail">Zona o barrio (opcional)</Label>
        <Input
          id="location_detail"
          placeholder="Ej: Providencia, sector Bellavista..."
          {...register('location_detail')}
        />
        {errors.location_detail && (
          <p className="text-sm text-destructive">{errors.location_detail.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar alerta
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
