import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  APP_NAME,
  APP_LOGO_URL,
  APP_LOGO_WEBP_URL,
  APP_LOGO_LIGHT_URL,
  APP_LOGO_LIGHT_WEBP_URL,
  APP_LOGO_ICON_URL,
  APP_LOGO_ICON_WEBP_URL,
} from '@/lib/constants'

type BrandLogoProps = {
  /** full = wordmark; icon = solo emblema circular */
  variant?: 'full' | 'icon'
  /** full = wordmark completo; compact = más bajo para headers */
  size?: 'sm' | 'md' | 'lg'
  to?: string | null
  className?: string
  /** Si true, no envuelve en Link */
  decorative?: boolean
  /**
   * dark = texto blanco (fondos oscuros /home)
   * light = texto oscuro (headers claros)
   * auto = ambos assets; CSS elige según clase .dark
   */
  tone?: 'dark' | 'light' | 'auto'
  /** Prioridad alta para LCP (header home) */
  priority?: boolean
}

const SIZE_CLASS = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
} as const

const ICON_SIZE_CLASS = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const

function LogoPicture({
  webp,
  png,
  alt,
  className,
  width,
  height,
  priority,
  ariaHidden,
}: {
  webp: string
  png: string
  alt: string
  className: string
  width: number
  height: number
  priority?: boolean
  ariaHidden?: boolean
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      <img
        src={png}
        alt={alt}
        className={className}
        width={width}
        height={height}
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        aria-hidden={ariaHidden || undefined}
      />
    </picture>
  )
}

export function BrandLogo({
  variant = 'full',
  size = 'md',
  to = '/home',
  className,
  decorative = false,
  tone = 'auto',
  priority = false,
}: BrandLogoProps) {
  const imgClass = cn(
    'object-contain',
    variant === 'icon'
      ? cn(ICON_SIZE_CLASS[size], 'max-w-none')
      : cn(
          'w-auto max-w-[min(100%,280px)] object-left',
          SIZE_CLASS[size],
        ),
    className,
  )

  let img: ReactNode

  if (variant === 'icon') {
    img = (
      <LogoPicture
        webp={APP_LOGO_ICON_WEBP_URL}
        png={APP_LOGO_ICON_URL}
        alt={APP_NAME}
        className={imgClass}
        width={112}
        height={112}
        priority={priority}
      />
    )
  } else if (tone === 'dark') {
    img = (
      <LogoPicture
        webp={APP_LOGO_WEBP_URL}
        png={APP_LOGO_URL}
        alt={APP_NAME}
        className={imgClass}
        width={280}
        height={80}
        priority={priority}
      />
    )
  } else if (tone === 'light') {
    img = (
      <LogoPicture
        webp={APP_LOGO_LIGHT_WEBP_URL}
        png={APP_LOGO_LIGHT_URL}
        alt={APP_NAME}
        className={imgClass}
        width={280}
        height={80}
        priority={priority}
      />
    )
  } else {
    img = (
      <span className="relative inline-flex items-center">
        <LogoPicture
          webp={APP_LOGO_LIGHT_WEBP_URL}
          png={APP_LOGO_LIGHT_URL}
          alt={APP_NAME}
          className={cn(imgClass, 'dark:hidden')}
          width={280}
          height={80}
          priority={priority}
        />
        <LogoPicture
          webp={APP_LOGO_WEBP_URL}
          png={APP_LOGO_URL}
          alt=""
          className={cn(imgClass, 'hidden dark:block')}
          width={280}
          height={80}
          priority={priority}
          ariaHidden
        />
      </span>
    )
  }

  if (decorative || to === null) {
    return <span className="inline-flex items-center">{img}</span>
  }

  return (
    <Link
      to={to}
      className="inline-flex items-center transition-opacity hover:opacity-90"
      aria-label={APP_NAME}
    >
      {img}
    </Link>
  )
}
