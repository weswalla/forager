'use client'

import { useEffect, useRef, useState } from 'react'
import type { Trail } from '@/lib/types'
import { PANE_ROOT, paneOfStep, searchQueryOf } from '@/lib/helpers'
import { LinkCard } from './LinkCard'
import { Thumb } from './ui'
import styles from './Footer.module.css'

/**
 * Walked path. On desktop a slim bar sits at the bottom (a grouped Seeds chip +
 * one chip per step) that can expand into a full-height overlay. On mobile the
 * bar isn't useful, so only a compact "trail" trigger shows — tapping it opens
 * the same full-height overlay. The overlay lists the walk vertically as normal
 * url cards.
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

  // keep the newest step visible as the walk grows (collapsed bar scroll)
  const pathRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = pathRef.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [path.length, started])

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

  return (
    <>
      {/* slim desktop bar */}
      <footer className={styles.trailBar}>
        <div className={styles.head}>
          <span>◈ Walked path</span>
          <span className={styles.steps}>{summary}</span>
          <button
            className={styles.expandBtn}
            title="Expand the path"
            onClick={() => setExpanded(true)}
          >
            ▴
          </button>
        </div>
        <div className={styles.path} ref={pathRef}>
          {!started ? (
            <div className={styles.hint}>🌱 Plant your seeds, then press “Start wandering”.</div>
          ) : (
            <>
              <button
                className={`${styles.step} ${styles.seedGroup} ${
                  activeStep === PANE_ROOT ? styles.active : ''
                }`}
                onClick={() => onNavigate(PANE_ROOT)}
              >
                {query ? (
                  <span className={styles.seedStack}>🔎</span>
                ) : (
                  <span className={styles.seedStack}>
                    {seeds.map((s) => (
                      <Thumb key={s.url} url={s.url} image={s.image} size={24} radius={7} className={styles.stackThumb} />
                    ))}
                  </span>
                )}
                <span className={`${styles.title} ${styles.seedTitle}`}>
                  {query ? `“${query}”` : originLabel}
                </span>
              </button>
              {path.map((link, i) => {
                const paneIdx = paneOfStep(i)
                return (
                  <span key={`${i}-${link.url}`} className={styles.segment}>
                    <span className={styles.connector}>›</span>
                    <span
                      className={`${styles.step} ${paneIdx === activeStep ? styles.active : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onNavigate(paneIdx)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(paneIdx) }}
                    >
                      <Thumb url={link.url} image={link.image} size={26} radius={7} />
                      <span className={styles.title}>{link.title}</span>
                      {!trail.collection && (
                        <button
                          className={styles.x}
                          title="Remove from trail"
                          onClick={(e) => { e.stopPropagation(); onRemoveStep(i) }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </span>
                )
              })}
            </>
          )}
        </div>
      </footer>

      {/* compact mobile trigger — the slim bar isn't useful on phones */}
      <button className={styles.mobileTrigger} onClick={() => setExpanded(true)}>
        <span className={styles.mobileTriggerLabel}>◈ Walked path</span>
        <span className={styles.mobileTriggerSteps}>{summary}</span>
        <span className={styles.mobileTriggerChevron}>▴</span>
      </button>

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
                        <div className={`${styles.sheetCard} ${paneIdx === activeStep ? styles.sheetCardActive : ''}`}>
                          <span className={styles.sheetNum}>{i + 1}</span>
                          <div className={styles.sheetCardBody}>
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
