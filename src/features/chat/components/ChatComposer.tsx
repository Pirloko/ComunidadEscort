import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Smile, Sticker, ImagePlay, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  CHAT_EMOJIS,
  CHAT_STICKERS,
  FEATURED_GIFS,
  searchTenorGifs,
  isAllowedGifUrl,
  type GifItem,
} from '@/features/chat/lib/chat-media'
import { cn } from '@/lib/utils'
import type { CommunityMessageKind } from '@/types/chat'

type Panel = 'emoji' | 'sticker' | 'gif' | null

interface ChatComposerProps {
  disabled?: boolean
  sending?: boolean
  onSendText: (text: string) => void
  onSendMedia: (payload: {
    kind: Exclude<CommunityMessageKind, 'text'>
    content: string
    mediaUrl?: string | null
  }) => void
}

export function ChatComposer({ disabled, sending, onSendText, onSendMedia }: ChatComposerProps) {
  const [content, setContent] = useState('')
  const [panel, setPanel] = useState<Panel>(null)
  const [gifQuery, setGifQuery] = useState('')
  const [gifResults, setGifResults] = useState<GifItem[]>(FEATURED_GIFS)
  const [gifLoading, setGifLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasTenorKey = Boolean(import.meta.env.VITE_TENOR_API_KEY?.trim())

  useEffect(() => {
    if (panel !== 'gif') return
    if (!hasTenorKey) {
      setGifResults(FEATURED_GIFS)
      return
    }

    const q = gifQuery.trim()
    if (!q) {
      setGifResults(FEATURED_GIFS)
      return
    }

    const t = window.setTimeout(() => {
      setGifLoading(true)
      void searchTenorGifs(q)
        .then((rows) => setGifResults(rows.length ? rows : FEATURED_GIFS))
        .finally(() => setGifLoading(false))
    }, 350)

    return () => window.clearTimeout(t)
  }, [gifQuery, panel, hasTenorKey])

  const togglePanel = (next: Panel) => {
    setPanel((prev) => (prev === next ? null : next))
  }

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + emoji)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = content.slice(0, start) + emoji + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleSend = () => {
    const text = content.trim()
    if (!text || disabled || sending) return
    onSendText(text)
    setContent('')
    setPanel(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sendSticker = (emoji: string) => {
    onSendMedia({ kind: 'sticker', content: emoji })
    setPanel(null)
  }

  const sendGif = (gif: GifItem) => {
    if (!isAllowedGifUrl(gif.url)) return
    onSendMedia({ kind: 'gif', content: gif.label.slice(0, 200), mediaUrl: gif.url })
    setPanel(null)
    setGifQuery('')
  }

  return (
    <div className="border-t p-3 sm:p-4">
      {panel && (
        <div className="mb-3 rounded-xl border bg-muted/40 p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-medium text-muted-foreground">
              {panel === 'emoji' && 'Emoticones'}
              {panel === 'sticker' && 'Stickers'}
              {panel === 'gif' && 'GIFs'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPanel(null)}
              aria-label="Cerrar panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {panel === 'emoji' && (
            <div className="grid max-h-40 grid-cols-8 gap-0.5 overflow-y-auto sm:grid-cols-10">
              {CHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1.5 text-xl transition-colors hover:bg-background"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {panel === 'sticker' && (
            <div className="grid max-h-44 grid-cols-5 gap-1 overflow-y-auto sm:grid-cols-6">
              {CHAT_STICKERS.map((emoji) => (
                <button
                  key={`sticker-${emoji}`}
                  type="button"
                  className="rounded-lg p-2 text-3xl transition-colors hover:bg-background"
                  onClick={() => sendSticker(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {panel === 'gif' && (
            <div className="space-y-2">
              <Input
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                placeholder={
                  hasTenorKey
                    ? 'Buscar GIF…'
                    : 'Destacados (opcional: VITE_TENOR_API_KEY para buscar)'
                }
                className="h-9"
                disabled={!hasTenorKey}
              />
              {gifLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {gifResults.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      className="overflow-hidden rounded-lg border bg-background transition-opacity hover:opacity-90"
                      onClick={() => sendGif(gif)}
                      title={gif.label}
                    >
                      <img
                        src={gif.preview}
                        alt={gif.label}
                        className="aspect-square h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mb-2 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', panel === 'emoji' && 'bg-muted')}
          onClick={() => togglePanel('emoji')}
          aria-label="Emoticones"
          disabled={disabled || sending}
        >
          <Smile className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', panel === 'sticker' && 'bg-muted')}
          onClick={() => togglePanel('sticker')}
          aria-label="Stickers"
          disabled={disabled || sending}
        >
          <Sticker className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', panel === 'gif' && 'bg-muted')}
          onClick={() => togglePanel('gif')}
          aria-label="GIFs"
          disabled={disabled || sending}
        >
          <ImagePlay className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… o usa emoji / sticker / GIF"
          rows={1}
          maxLength={2000}
          className="min-h-[44px] resize-none"
          aria-label="Mensaje al chat de la comunidad"
          disabled={disabled || sending}
        />
        <Button
          variant="accent"
          size="icon"
          className="shrink-0"
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
