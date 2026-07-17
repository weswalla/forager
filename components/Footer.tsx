'use client'

import { useEffect, useRef } from 'react'
import type { Trail } from '@/lib/types'
import { PANE_RESULTS, PANE_SEED, paneOfStep } from '@/lib/helpers'
import { Thumb } from './ui'
import styles from './Footer.module.css'

/**
 * Walked path: a grouped Seeds chip + one chip per step.
 * Chips navigate (scroll) only; × removes a step. Selecting a card elsewhere
 * appends to the end — the footer never mutates order.
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

  // keep the newest step visible as the walk grows
  const pathRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = pathRef.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [path.length, started])
  const seeds = trail.origin ? trail.origin.links.slice(0, 3) : trail.seeds
  const originLabel = shared ? 'Trail' : 'Seeds'
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

  return (
    <footer className={styles.trailBar}>
      <div className={styles.head}>
        <span>◈ Walked path</span>
        <span className={styles.steps}>
          {!started
            ? 'choosing seeds'
            : plural(seeds.length, 'seed') + (path.length ? ` · ${plural(path.length, 'step')}` : '')}
        </span>
      </div>
      <div className={styles.path} ref={pathRef}>
        {!started ? (
          <div className={styles.hint}>🌱 Plant your seeds, then press “Start wandering”.</div>
        ) : (
          <>
            <button
              className={`${styles.step} ${styles.seedGroup} ${
                activeStep === PANE_SEED || (!shared && activeStep === PANE_RESULTS)
                  ? styles.active
                  : ''
              }`}
              onClick={() => onNavigate(PANE_SEED)}
            >
              <span className={styles.seedStack}>
                {seeds.map((s) => (
                  <Thumb key={s.url} url={s.url} image={s.image} size={24} radius={7} className={styles.stackThumb} />
                ))}
              </span>
              <span className={`${styles.title} ${styles.seedTitle}`}>{originLabel}</span>
            </button>
            {path.map((link, i) => {
              const paneIdx = paneOfStep(i, shared)
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
  )
}
