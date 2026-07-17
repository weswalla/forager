'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Link, Trail } from '@/lib/types'
import { LinkPane, ResultsPane, SeedPane, SharedTrailPane } from './Pane'
import styles from './Panes.module.css'

/**
 * Ordered pane strip. Child indices are the navigation model:
 * 0 = seed pane, 1 = results pane, i+2 = walked pane for path[i].
 * Owns horizontal scroll; focuses activeStep whenever it changes.
 * On phones the strip is a snap gallery with floating position dots.
 */
export function Panes({
  trail,
  activeStep,
  onOpen,
  onCycleSeed,
  onRemoveSeed,
  onAddSeed,
  onRefreshSeeds,
  onQuerySeed,
  onStart,
  onFocus,
}: {
  trail: Trail
  activeStep: number
  onOpen: (link: Link) => void
  onCycleSeed: (i: number) => void
  onRemoveSeed: (i: number) => void
  onAddSeed: () => void
  onRefreshSeeds: () => void
  onQuerySeed: (query: string) => void
  onStart: () => void
  onFocus: (pane: number) => void
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visible, setVisible] = useState(0)

  // urls already on the trail — hidden from every related list
  const excludeUrls = useMemo(
    () => new Set([...trail.seeds, ...trail.path].map((l) => l.url)),
    [trail.seeds, trail.path]
  )

  const paneCount =
    1 + (trail.started && !trail.origin ? 1 : 0) + (trail.started ? trail.path.length : 0)

  useEffect(() => {
    const pane = wrap.current?.children[activeStep] as HTMLElement | undefined
    pane?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    setVisible(Math.min(activeStep, paneCount - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, trail.id, trail.started, trail.path.length])

  /** Track which pane the gallery has settled on; sync focus after scrolling stops. */
  const handleScroll = (e: React.UIEvent) => {
    const el = wrap.current
    if (!el || e.target !== el) return // ignore bubbled scrolls from pane bodies
    const base = el.getBoundingClientRect().left
    let best = 0
    let bestD = Infinity
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs(c.getBoundingClientRect().left - base)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setVisible(best)
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      if (best !== activeStep) onFocus(best)
    }, 180)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panes} ref={wrap} onScroll={handleScroll}>
        {trail.origin ? (
          <SharedTrailPane key={`shared-${trail.id}`} origin={trail.origin} onOpen={onOpen} />
        ) : (
          <SeedPane
            key={`seed-${trail.id}`}
            seeds={trail.seeds}
            started={trail.started}
            onCycle={onCycleSeed}
            onRemove={onRemoveSeed}
            onAdd={onAddSeed}
            onRefreshAll={onRefreshSeeds}
            onQuerySeed={onQuerySeed}
            onStart={onStart}
          />
        )}
        {trail.started && !trail.origin && (
          <ResultsPane
            key={`results-${trail.id}`}
            seeds={trail.seeds}
            exclude={excludeUrls}
            onOpen={onOpen}
          />
        )}
        {trail.started &&
          trail.path.map((link, i) => (
            <LinkPane
              key={`${trail.id}-${i}-${link.url}`}
              link={link}
              step={i + 1}
              exclude={excludeUrls}
              onOpen={onOpen}
            />
          ))}
      </div>
      {paneCount > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: paneCount }, (_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === visible ? styles.dotOn : ''}`}
              aria-label={`Go to pane ${i + 1}`}
              onClick={() => onFocus(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
