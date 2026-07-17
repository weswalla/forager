'use client'

import type { Trail } from '@/lib/types'
import styles from './TrailsDrawer.module.css'

export function TrailsDrawer({
  open,
  trails,
  currentId,
  onSelect,
  onNew,
  onRename,
  onSetDescription,
  onSaveCollection,
  onShare,
  onDelete,
}: {
  open: boolean
  trails: Trail[]
  currentId: string
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onSetDescription: (id: string, description: string) => void
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
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('input,textarea,button')) return
              onSelect(t.id)
            }}
          >
            <input
              key={`title-${t.id}-${t.title}`}
              className={styles.title}
              defaultValue={t.title}
              spellCheck={false}
              readOnly={Boolean(t.collection)}
              aria-label="Trail title"
              onBlur={(e) => onRename(t.id, e.target.value)}
            />
            <textarea
              key={`desc-${t.id}-${t.description}`}
              className={styles.desc}
              defaultValue={t.description}
              spellCheck={false}
              rows={2}
              readOnly={Boolean(t.collection)}
              aria-label="Trail description"
              onBlur={(e) => onSetDescription(t.id, e.target.value)}
            />
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
