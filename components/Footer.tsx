'use client'

import { useState } from 'react'
import type { Trail } from '@/lib/types'
import { PANE_ROOT, paneOfStep, searchQueryOf } from '@/lib/helpers'
import { LinkCard } from './LinkCard'
import styles from './Footer.module.css'

/**
 * Walked path. Collapsed, it's a slim bar of position dots (one per pane, the
 * active one highlighted) with an expand arrow — no labels. Tapping the bar (or
 * the arrow) opens a full-height overlay that lists the walk vertically as
 * normal url cards. A "Finish trail" button lives at the far end of the bar
 * once there's a walk to finish.
 */
export function Footer({
  trail,
  activeStep,
  onNavigate,
  onRemoveStep,
}: {
  trail: Trail
  activeStep: number
  onNavigate: (pane: number) => void
  onRemoveStep: (index: number) => void
}) {
  const { started, path } = trail
  const shared = Boolean(trail.origin)
  const [expanded, setExpanded] = useState(false)

  const seeds = trail.origin ? trail.origin.links.slice(0, 3) : trail.seeds
  // a trail seeded by a single question is labelled by the question, not thumbs
  const query = !shared && seeds.length === 1 ? searchQueryOf(seeds[0].url) : null
  const originLabel = shared ? 'Trail' : query ? 'Question' : 'Seeds'
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
  const summary = !started
    ? 'choosing seeds'
    : (query ? 'a question' : plural(seeds.length, 'seed')) +
      (path.length ? ` · ${plural(path.length, 'step')}` : '')

  const navigate = (pane: number) => {
    onNavigate(pane)
    setExpanded(false)
  }

  // one dot per pane: the root (seeds/question/shared) then each walked step
  const paneCount = 1 + path.length

  return (
    <>
      {/* slim bar — navigable position dots centered in the middle, with a small
          expand icon at the right (scrollable dots when the walk is long) */}
      <footer className={styles.trailBar}>
        <div className={styles.dots}>
          <div className={styles.dotsRail}>
            {Array.from({ length: paneCount }, (_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeStep ? styles.dotOn : ''}`}
                aria-label={`Go to pane ${i + 1}`}
                aria-current={i === activeStep ? 'true' : undefined}
                onClick={() => onNavigate(i)}
              />
            ))}
          </div>
        </div>
        <button
          className={styles.expandIcon}
          title="Expand the walked path"
          aria-label="Expand the walked path"
          onClick={() => setExpanded(true)}
        >
          ⤢
        </button>
      </footer>

      {/* full-height overlay — the walk as a vertical list of url cards */}
      {expanded && (
        <div className={styles.overlay} onClick={() => setExpanded(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}>
              <div>
                <div className={styles.sheetEyebrow}>◈ Walked path</div>
                <div className={styles.sheetSummary}>{summary}</div>
              </div>
              <button className={styles.sheetClose} title="Close" onClick={() => setExpanded(false)}>
                ×
              </button>
            </div>
            <div className={styles.sheetBody}>
              {!started ? (
                <div className={styles.hint}>🌱 Plant your seeds, then press “Start wandering”.</div>
              ) : (
                <>
                  <div
                    className={`${styles.rootCard} ${activeStep === PANE_ROOT ? styles.rootActive : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(PANE_ROOT)}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(PANE_ROOT) }}
                  >
                    <span className={styles.rootIcon}>
                      {query ? '🔎' : shared ? '⇗' : '🌱'}
                    </span>
                    <div>
                      <div className={styles.rootLabel}>
                        {query ? `“${query}”` : shared ? 'Shared trail' : `${plural(seeds.length, 'seed')}`}
                      </div>
                      <div className={styles.rootSub}>{originLabel}</div>
                    </div>
                  </div>
                  {path.map((link, i) => {
                    const paneIdx = paneOfStep(i)
                    return (
                      <div key={`${i}-${link.url}`} className={styles.sheetStep}>
                        <span className={styles.sheetConnector}>↓</span>
                        <div className={styles.sheetCard}>
                          <span className={styles.sheetNum}>{i + 1}</span>
                          <div className={`${styles.sheetCardBody} ${paneIdx === activeStep ? styles.sheetCardActive : ''}`}>
                            <LinkCard
                              link={link}
                              onClick={() => navigate(paneIdx)}
                              onRemove={trail.collection ? undefined : () => onRemoveStep(i)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {path.length === 0 && (
                    <div className={styles.hint}>Follow a link to begin your walk.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
