import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { profileService } from '@/services/profile.service'

interface AvatarUploadProps {
  userId: string
  alias: string
  currentUrl?: string | null
  onUploaded: (url: string) => void
}

export function AvatarUpload({ userId, alias, currentUrl, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setPreview(URL.createObjectURL(file))
    setIsUploading(true)

    try {
      const url = await profileService.uploadAvatar(userId, file)
      onUploaded(url)
      setPreview(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
      setPreview(currentUrl ?? null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar src={preview} alias={alias} size="xl" />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Cambiar avatar"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 2 MB</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
