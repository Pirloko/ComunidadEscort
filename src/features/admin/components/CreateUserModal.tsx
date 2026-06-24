import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  adminCreateUserSchema,
  type AdminCreateUserFormData,
} from '@/features/admin/schemas/admin-create-user.schema'
import { cityService } from '@/services/city.service'
import { profileService } from '@/services/profile.service'
import { normalizePhoneChile } from '@/lib/phone'
import type { CreateUserAsAdminResult } from '@/types/admin'

interface CreateUserModalProps {
  onClose: () => void
}

export function CreateUserModal({ onClose }: CreateUserModalProps) {
  const queryClient = useQueryClient()
  const [credentials, setCredentials] = useState<CreateUserAsAdminResult | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: cities = [] } = useQuery({
    queryKey: ['public-cities'],
    queryFn: () => cityService.getPublicCities(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<AdminCreateUserFormData>({
    resolver: zodResolver(adminCreateUserSchema),
    mode: 'onBlur',
  })

  const createMutation = useMutation({
    mutationFn: (data: AdminCreateUserFormData) =>
      profileService.createUserAsAdmin({
        alias: data.alias,
        email: data.email,
        phone: normalizePhoneChile(data.phone),
        publication_link: data.publication_link,
        city_id: data.city_id || undefined,
      }),
    onSuccess: (result) => {
      setCredentials(result)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-users-count'] })
    },
    onError: (err) => {
      setError('root', { message: err instanceof Error ? err.message : 'Error al crear el usuario' })
    },
  })

  const handleCopy = async () => {
    if (!credentials) return
    await navigator.clipboard.writeText(
      `Email: ${credentials.email}\nContraseña temporal: ${credentials.temporaryPassword}`,
    )
    setCopied(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">
            {credentials ? 'Credenciales del usuario' : 'Crear usuario'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {credentials ? (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Copia ahora estas credenciales — no se volverán a mostrar.
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="rounded-md border bg-muted px-3 py-2 text-sm">{credentials.email}</p>
              </div>
              <div className="space-y-1">
                <Label>Contraseña temporal</Label>
                <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                  {credentials.temporaryPassword}
                </p>
              </div>
              <Button type="button" className="w-full gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar credenciales'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="space-y-3"
            >
              {errors.root && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="alias">Alias</Label>
                <Input id="alias" placeholder="su_alias" {...register('alias')} />
                {errors.alias && <p className="text-sm text-destructive">{errors.alias.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="usuaria@correo.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Celular</Label>
                <Input id="phone" type="tel" placeholder="+56 9 1234 5678" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Celular chileno: +56 9 seguido de 8 dígitos (ej: +56 9 1234 5678).
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="publication_link">Link de publicación</Label>
                <Input
                  id="publication_link"
                  type="url"
                  placeholder="https://..."
                  {...register('publication_link')}
                />
                {errors.publication_link && (
                  <p className="text-sm text-destructive">{errors.publication_link.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="city_id">Ciudad (opcional)</Label>
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
              </div>

              <p className="text-xs text-muted-foreground">
                La cuenta queda aprobada de inmediato con una contraseña temporal de un solo uso.
              </p>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={createMutation.isPending} className="gap-1">
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Crear usuario
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
