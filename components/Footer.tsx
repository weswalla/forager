'use client'

import { useEffect, useRef, useState } from 'react'
import type { Trail } from '@/lib/types'
import { PANE_RESULTS, PANE_SEED, paneOfStep } from '@/lib/helpers'
import { Thumb } from './ui'
import styles from './Footer.module.css'

/**
 * Walked path: a grouped Seeds chip + one chip per step.
 * Chips navigate (scroll) only; × removes a step. Selecting a card elsewhere
 * appends to the end — the footer never mutates order. The ▲ toggle expands
 * the bar into a taller vertical list of the walk.
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

  // keep the newest step visible as the walk grows
  const pathRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = pathRef.current
    if (el) el.scrollTo({ left: el.scrollWidth, top: el.scrollHeight, behavior: 'smooth' })
  }, [path.length, started, expanded])
  const seeds = trail.origin ? trail.origin.links.slice(0, 3) : trail.seeds
  const originLabel = shared ? 'Trail' : 'Seeds'
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

  return (
    <footer className={`${styles.trailBar} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.head}>
        <span>◈ Walked path</span>
        <span className={styles.steps}>
          {!started
            ? 'choosing seeds'
            : plural(seeds.length, 'seed') + (path.length ? ` · ${plural(path.length, 'step')}` : '')}
        </span>
        <button
          className={styles.expandBtn}
          title={expanded ? 'Collapse the path' : 'Expand the path'}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? '▾' : '▴'}
        </button>
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
                  <span className={styles.connector}>{expanded ? '↓' : '›'}</span>
                  <span
                    className={`${styles.step} ${paneIdx === activeStep ? styles.active : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigate(paneIdx)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(paneIdx) }}
                  >
                    <Thumb url={link.url} image={link.image} size={expanded ? 34 : 26} radius={7} />
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
