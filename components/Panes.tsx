'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Link, Trail } from '@/lib/types'
import { LinkPane, ResultsPane, SharedTrailPane } from './Pane'
import styles from './Panes.module.css'

/**
 * Ordered pane strip. Seeding happens on the home page, so the walk has no
 * seed pane: child 0 is the root (the results pane, or the shared-trail pane)
 * and walked panes follow from 1 (path[i] -> child i+1).
 * Owns horizontal scroll; focuses activeStep whenever it changes.
 * On phones the strip is a snap gallery with floating position dots.
 */
export function Panes({
  trail,
  activeStep,
  onOpen,
  onFocus,
}: {
  trail: Trail
  activeStep: number
  onOpen: (link: Link) => void
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

  // root pane (child 0) + one pane per walked step
  const paneCount = 1 + trail.path.length

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
          <ResultsPane
            key={`results-${trail.id}`}
            seeds={trail.seeds}
            exclude={excludeUrls}
            onOpen={onOpen}
          />
        )}
        {trail.path.map((link, i) => (
          <LinkPane
            key={`${trail.id}-${i}-${link.url}`}
            link={link}
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
