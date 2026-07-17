'use client'

import { useState } from 'react'
import type { Trail } from '@/lib/types'
import { Bear } from './Bear'
import styles from './SaveTrailModal.module.css'

/**
 * Name + describe a trail before publishing it as a Semble collection.
 * Once saved, the trail becomes read-only.
 */
export function SaveTrailModal({
  trail,
  pending,
  error,
  onClose,
  onSave,
}: {
  trail: Trail | null
  pending: boolean
  error: string | null
  onClose: () => void
  onSave: (info: { title: string; description: string }) => void
}) {
  const [title, setTitle] = useState(trail?.title ?? '')
  const [description, setDescription] = useState(trail?.description ?? '')

  if (!trail) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ title, description })
        }}
      >
        <button type="button" className={styles.close} title="Close" onClick={onClose}>
          ×
        </button>
        <Bear kind="forage" size={64} className={styles.mark} />
        <h2 className={styles.title}>Save trail to Semble</h2>
        <p className={styles.lede}>
          Publishes this trail as a Semble collection. Once saved it becomes read-only — a finished
          walk you can share.
        </p>
        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submit} type="submit" disabled={pending || !title.trim()}>
          {pending ? 'Saving…' : '✦ Save to Semble'}
        </button>
      </form>
    </div>
  )
}
