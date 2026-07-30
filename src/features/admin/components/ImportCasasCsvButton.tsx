import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCity } from '@/features/cities/context/CityContext'
import { resourceService } from '@/services/resource.service'

export function ImportCasasCsvButton() {
  const { user } = useAuth()
  const { cities } = useCity()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [resultMsg, setResultMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Debes iniciar sesión')
      const text = await file.text()
      return resourceService.importHabitacionesFromCsv(user.id, text, cities)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-casas'] })
      queryClient.invalidateQueries({ queryKey: ['casas-habitaciones'] })
      queryClient.invalidateQueries({ queryKey: ['public-habitaciones'] })
      queryClient.invalidateQueries({ queryKey: ['public-habitacion-cities'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })

      const parts = [`Se crearon ${result.created} casa(s).`]
      if (result.errors.length > 0) {
        const detail = result.errors
          .slice(0, 8)
          .map((e) => `Fila ${e.row}: ${e.message}`)
          .join('\n')
        const more =
          result.errors.length > 8 ? `\n…y ${result.errors.length - 8} error(es) más` : ''
        setErrorMsg(`${detail}${more}`)
        parts.push(`${result.errors.length} fila(s) con error.`)
      } else {
        setErrorMsg(null)
      }
      setResultMsg(parts.join(' '))
    },
    onError: (err) => {
      setResultMsg(null)
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo importar el CSV')
    },
  })

  const onPick = (file: File | undefined) => {
    if (!file) return
    setResultMsg(null)
    setErrorMsg(null)
    importMutation.mutate(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 gap-2"
        disabled={importMutation.isPending || !user || cities.length === 0}
        onClick={() => inputRef.current?.click()}
      >
        {importMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        Importar CSV
      </Button>
      {resultMsg && <p className="text-sm text-success">{resultMsg}</p>}
      {errorMsg && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {errorMsg}
        </pre>
      )}
    </div>
  )
}
