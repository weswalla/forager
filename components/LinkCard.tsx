'use client'

import type { Link, Rel } from '@/lib/types'
import { REL_META } from '@/lib/types'
import { Thumb } from './ui'
import styles from './LinkCard.module.css'

const BADGE_CLASS: Record<Rel, string> = {
  mutual: styles.relMutual,
  similar: styles.relSimilar,
  connected: styles.relConnected,
}

/**
 * One link, three variants:
 *  - 'list':   clickable card in a related list (rel badge, hover ×)
 *  - 'header': static compact card at the top of a walked pane
 *  - 'seed':   seed card with cycle/remove tools (hidden when locked)
 */
export function LinkCard({
  link,
  rel,
  note,
  variant = 'list',
  onClick,
  onCycle,
  onRemove,
  locked,
}: {
  link: Link
  rel?: Rel
  note?: string
  variant?: 'list' | 'header' | 'seed'
  onClick?: () => void
  onCycle?: () => void
  onRemove?: () => void
  locked?: boolean
}) {
  const classes = [
    styles.card,
    variant === 'header' ? styles.headerCard : '',
    variant === 'seed' ? styles.seedCard : '',
    variant === 'seed' && locked ? styles.locked : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <Thumb url={link.url} image={link.image} size={variant === 'header' ? 44 : 64} />
      <div className={styles.main}>
        <p className={styles.title}>{link.title}</p>
        <p className={styles.desc} title={note}>{note ? `↔ ${note} — ${link.description}` : link.description}</p>
        <div className={styles.meta}>
          {variant === 'seed' && <span className={`${styles.relBadge} ${styles.relMutual}`}>🌱 seed</span>}
          {variant === 'list' && rel && (
            <span className={`${styles.relBadge} ${BADGE_CLASS[rel]}`}>
              {REL_META[rel].icon} {REL_META[rel].label}
            </span>
          )}
          {/* the source domain links out to the original url */}
          <a
            className={variant === 'header' ? styles.heroDomain : styles.sourceLink}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${link.domain}`}
            onClick={(e) => e.stopPropagation()}
          >
            {link.domain}
          </a>
        </div>
      </div>

      {variant === 'seed' && !locked && (
        <div className={styles.seedTools}>
          {onCycle && (
            <button
              className={styles.seedTool}
              title="Swap for another"
              onClick={(e) => { e.stopPropagation(); onCycle() }}
            >
              ⟳
            </button>
          )}
          {onRemove && (
            <button
              className={styles.seedTool}
              title="Remove seed"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {variant === 'list' && onRemove && (
        <button
          className={styles.cardX}
          title="Remove"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        >
          ×
        </button>
      )}
    </div>
  )
}
