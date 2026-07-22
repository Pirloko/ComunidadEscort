/** Emoticones frecuentes para el chat */
export const CHAT_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😜', '🤪', '😝',
  '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
  '🙄', '😏', '😣', '😥', '😮', '😯', '😪', '😫', '🥱', '😴',
  '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯',
  '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😲',
  '😳', '🥺', '😦', '😧', '😨', '😰', '😢', '😭', '😱', '😖',
  '😞', '😓', '😩', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
  '☠️', '💩', '🤡', '👹', '👍', '👎', '👏', '🙌', '👐', '🤝',
  '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉',
  '👆', '👇', '☝️', '✋', '💪', '🦾', '🫶', '❤️', '🧡', '💛',
  '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓',
  '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟', '💥', '💯',
  '✅', '❌', '⚠️', '🎉', '🎊', '🎈', '💋', '💄', '💅', '👠',
  '👗', '👑', '💎', '🌸',
]

/** Stickers: emojis grandes que se envían como mensaje aparte */
export const CHAT_STICKERS = [
  '😍', '🥰', '😘', '😂', '🤣', '😭', '🥺', '😱', '🤯', '😎',
  '🥳', '🤩', '😈', '👻', '💀', '🤡', '💩', '🔥', '💯', '❤️',
  '💔', '💋', '💅', '👑', '✨', '💪', '🙏', '👍', '👎', '👏',
  '🙌', '🤝', '✌️', '🤟', '👀', '🙈', '🙉', '🙊', '🐱', '🐶',
  '🦄', '🍑', '🌶️', '🍾', '🥂', '💃', '🕺', '👠', '💄', '💎',
]

export interface GifItem {
  id: string
  url: string
  preview: string
  label: string
}

/** GIFs destacados (CDN Giphy, sin API key) */
export const FEATURED_GIFS: GifItem[] = [
  {
    id: 'hi',
    label: 'Hola',
    url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
    preview: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
  },
  {
    id: 'love',
    label: 'Amor',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'clap',
    label: 'Aplausos',
    url: 'https://media.giphy.com/media/7rj2ZgrrHaqco/giphy.gif',
    preview: 'https://media.giphy.com/media/7rj2ZgrrHaqco/giphy.gif',
  },
  {
    id: 'lol',
    label: 'Jaja',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    preview: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
  },
  {
    id: 'ok',
    label: 'Ok',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    preview: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  },
  {
    id: 'party',
    label: 'Fiesta',
    url: 'https://media.giphy.com/media/l0M9bPQQ5y9z8/giphy.gif',
    preview: 'https://media.giphy.com/media/l0M9bPQQ5y9z8/giphy.gif',
  },
  {
    id: 'thanks',
    label: 'Gracias',
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    preview: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  },
  {
    id: 'wow',
    label: 'Wow',
    url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
    preview: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
  },
]

const ALLOWED_GIF_HOSTS = [
  'media.tenor.com',
  'c.tenor.com',
  'media.giphy.com',
  'i.giphy.com',
  'giphy.com',
]

export function isAllowedGifUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    return ALLOWED_GIF_HOSTS.some(
      (host) => u.hostname === host || u.hostname.endsWith(`.${host}`),
    )
  } catch {
    return false
  }
}

export async function searchTenorGifs(query: string): Promise<GifItem[]> {
  const key = import.meta.env.VITE_TENOR_API_KEY as string | undefined
  if (!key?.trim()) return []

  const params = new URLSearchParams({
    key: key.trim(),
    q: query.trim() || 'funny',
    limit: '24',
    media_filter: 'gif',
    client_key: 'comunidadescort_chat',
  })

  const res = await fetch(`https://tenor.googleapis.com/v2/search?${params}`)
  if (!res.ok) return []

  const json = (await res.json()) as {
    results?: Array<{
      id: string
      content_description?: string
      media_formats?: {
        gif?: { url: string }
        tinygif?: { url: string }
        nanogif?: { url: string }
      }
    }>
  }

  return (json.results ?? [])
    .map((r) => {
      const url = r.media_formats?.gif?.url ?? r.media_formats?.tinygif?.url
      const preview =
        r.media_formats?.nanogif?.url ??
        r.media_formats?.tinygif?.url ??
        url
      if (!url || !preview || !isAllowedGifUrl(url)) return null
      return {
        id: r.id,
        url,
        preview,
        label: r.content_description ?? 'GIF',
      } satisfies GifItem
    })
    .filter((x): x is GifItem => x !== null)
}
