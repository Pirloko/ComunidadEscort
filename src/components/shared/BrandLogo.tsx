import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  APP_NAME,
  APP_LOGO_URL,
  APP_LOGO_LIGHT_URL,
  APP_LOGO_ICON_URL,
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

export function BrandLogo({
  variant = 'full',
  size = 'md',
  to = '/home',
  className,
  decorative = false,
  tone = 'auto',
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
      <img
        src={APP_LOGO_ICON_URL}
        alt={APP_NAME}
        className={imgClass}
        width={112}
        height={112}
        decoding="async"
      />
    )
  } else if (tone === 'dark') {
    img = (
      <img
        src={APP_LOGO_URL}
        alt={APP_NAME}
        className={imgClass}
        width={280}
        height={80}
        decoding="async"
      />
    )
  } else if (tone === 'light') {
    img = (
      <img
        src={APP_LOGO_LIGHT_URL}
        alt={APP_NAME}
        className={imgClass}
        width={280}
        height={80}
        decoding="async"
      />
    )
  } else {
    img = (
      <span className="relative inline-flex items-center">
        <img
          src={APP_LOGO_LIGHT_URL}
          alt={APP_NAME}
          className={cn(imgClass, 'dark:hidden')}
          width={280}
          height={80}
          decoding="async"
        />
        <img
          src={APP_LOGO_URL}
          alt=""
          aria-hidden
          className={cn(imgClass, 'hidden dark:block')}
          width={280}
          height={80}
          decoding="async"
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
