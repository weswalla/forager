'use client'

import { useEffect, useMemo, useRef } from 'react'
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

  // urls already on the trail — hidden from every related list
  const excludeUrls = useMemo(
    () => new Set([...trail.seeds, ...trail.path].map((l) => l.url)),
    [trail.seeds, trail.path]
  )

  useEffect(() => {
    const pane = wrap.current?.children[activeStep] as HTMLElement | undefined
    pane?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, trail.id, trail.started, trail.path.length])

  /** Sync focus (which drives the bottom dots) once the gallery settles on a pane. */
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
    // On desktop several panes are visible at once, so the last pane's left edge
    // can never reach the container's left — "closest to left" would wrongly snap
    // back off the final pane. If we're scrolled to the end, the last pane is active.
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2
    if (atEnd) best = el.children.length - 1
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
    </div>
  )
}
