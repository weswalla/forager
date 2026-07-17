'use client'

import { useCallback, useRef, useState } from 'react'
import { thumbFor } from '@/lib/helpers'
import styles from './ui.module.css'

/* ---- Thumb: image if available, else deterministic gradient + emoji ---- */

export function Thumb({
  url,
  image,
  size = 64,
  radius = 10,
  className,
}: {
  url: string
  image?: string
  size?: number
  radius?: number
  className?: string
}) {
  const style = { width: size, height: size, borderRadius: radius, fontSize: size * 0.42 }
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`${styles.thumb} ${className ?? ''}`} style={style} />
  }
  const { gradient, emoji } = thumbFor(url)
  return (
    <div className={`${styles.thumb} ${className ?? ''}`} style={{ ...style, background: gradient }}>
      {emoji}
    </div>
  )
}

/* ---- IconButton ---- */

export function IconButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`${styles.iconBtn} ${active ? styles.iconBtnActive : ''}`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/* ---- Toast ---- */

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const show = useCallback((msg: string) => {
    setMessage(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 2400)
  }, [])
  return { message, show }
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={`${styles.toast} ${message ? styles.toastShow : ''}`} role="status">
      {message}
    </div>
  )
}
