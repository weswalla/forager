'use client'

import { useState } from 'react'
import type { Trail } from '@/lib/types'
import styles from './SaveTrailModal.module.css'

/** Edit a trail's title + description (drawer "edit" button). Saved trails are read-only. */
export function EditTrailModal({
  trail,
  onClose,
  onSave,
}: {
  trail: Trail | null
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
        <h2 className={styles.title}>Edit trail</h2>
        <p className={styles.lede}>Rename this trail and update its description.</p>
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
        <button className={styles.submit} type="submit" disabled={!title.trim()}>
          Save changes
        </button>
      </form>
    </div>
  )
}
