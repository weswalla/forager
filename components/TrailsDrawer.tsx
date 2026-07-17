'use client'

import type { Trail } from '@/lib/types'
import styles from './TrailsDrawer.module.css'

export function TrailsDrawer({
  open,
  trails,
  currentId,
  onSelect,
  onNew,
  onEdit,
  onSaveCollection,
  onShare,
  onDelete,
}: {
  open: boolean
  trails: Trail[]
  currentId: string
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (id: string) => void
  onSaveCollection: (id: string) => void
  onShare: (id: string) => void
  onDelete: (id: string) => void
}) {
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

  return (
    <aside className={`${styles.drawer} ${open ? '' : styles.collapsed}`}>
      <h2 className={styles.heading}>Your Trails</h2>
      <div className={styles.sub}>
        Walking sessions you can name, revisit, and turn into Semble collections.
      </div>
      <div className={styles.list}>
        {trails.map((t) => (
          <div
            key={t.id}
            className={`${styles.trail} ${t.id === currentId ? styles.current : ''}`}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return
              onSelect(t.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(t.id)
              }
            }}
          >
            <div className={styles.trailHead}>
              <span className={styles.title}>{t.title}</span>
              {!t.collection && (
                <button
                  className={styles.edit}
                  title="Edit title & description"
                  aria-label="Edit trail"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(t.id)
                  }}
                >
                  ✎
                </button>
              )}
            </div>
            {t.description && <div className={styles.desc}>{t.description}</div>}
            <div className={styles.meta}>
              <span className={styles.dot} />{' '}
              {t.origin ? `from ${t.origin.author}` : plural(t.seeds.length, 'seed')}
              {t.started ? ` · ${plural(t.path.length, 'step')}` : ' · not started'} · {t.createdAt}
            </div>
            {t.collection ? (
              <div className={styles.savedBadge}>✦ Saved to Semble · read-only</div>
            ) : (
              <button
                className={styles.saveCollection}
                onClick={(e) => {
                  e.stopPropagation()
                  onSaveCollection(t.id)
                }}
              >
                ✦ Save as Semble collection
              </button>
            )}
            {t.collection && (
              <button
                className={styles.share}
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(t.id)
                }}
              >
                ⇗ Share this trail
              </button>
            )}
            <button
              className={styles.delete}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(t.id)
              }}
            >
              🗑 Delete trail
            </button>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <button className={styles.newTrail} onClick={onNew}>
          ＋ Start a new trail
        </button>
      </div>
    </aside>
  )
}
