'use client'

import { useState } from 'react'
import { Bear } from './Bear'
import styles from './SignIn.module.css'

export function SignInModal({
  open,
  pending,
  error,
  onClose,
  onSignIn,
}: {
  open: boolean
  pending: boolean
  error: string | null
  onClose: () => void
  onSignIn: (apiKey: string) => void
}) {
  const [key, setKey] = useState('')
  const mock = Boolean(process.env.NEXT_PUBLIC_USE_MOCK)

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSignIn(key)
        }}
      >
        <button type="button" className={styles.close} title="Close" onClick={onClose}>
          ×
        </button>
        <Bear kind="peek" size={72} className={styles.mark} />
        <h2 className={styles.title}>Sign in to Semble</h2>
        <p className={styles.lede}>
          Paste your Semble API key to save and share trails.{' '}
          <a
            className={styles.keyLink}
            href="https://semble.so/settings/api-keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get your API key ↗
          </a>
        </p>
        <input
          className={styles.input}
          type="password"
          placeholder="Semble API key"
          value={key}
          autoFocus
          onChange={(e) => setKey(e.target.value)}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submit} type="submit" disabled={pending || !key.trim()}>
          {pending ? 'Signing in…' : 'Sign in →'}
        </button>
        {mock && <p className={styles.hint}>Mock mode — any key will do.</p>}
      </form>
    </div>
  )
}
