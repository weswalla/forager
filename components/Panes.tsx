'use client'

import { useEffect, useRef } from 'react'
import type { Link, Trail } from '@/lib/types'
import { LinkPane, ResultsPane, SeedPane, SharedTrailPane } from './Pane'
import styles from './Panes.module.css'

/**
 * Ordered pane strip. Child indices are the navigation model:
 * 0 = seed pane, 1 = results pane, i+2 = walked pane for path[i].
 * Owns horizontal scroll; focuses activeStep whenever it changes.
 */
export function Panes({
  trail,
  activeStep,
  onOpen,
  onCycleSeed,
  onRemoveSeed,
  onAddSeed,
  onStart,
  onSaveLink,
}: {
  trail: Trail
  activeStep: number
  onOpen: (link: Link) => void
  onCycleSeed: (i: number) => void
  onRemoveSeed: (i: number) => void
  onAddSeed: () => void
  onStart: () => void
  onSaveLink: (link: Link) => void
}) {
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pane = wrap.current?.children[activeStep] as HTMLElement | undefined
    pane?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [activeStep, trail.id, trail.started, trail.path.length])

  return (
    <div className={styles.panes} ref={wrap}>
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
          onStart={onStart}
        />
      )}
      {trail.started && !trail.origin && (
        <ResultsPane key={`results-${trail.id}`} seeds={trail.seeds} onOpen={onOpen} />
      )}
      {trail.started &&
        trail.path.map((link, i) => (
          <LinkPane
            key={`${trail.id}-${i}-${link.url}`}
            link={link}
            step={i + 1}
            onOpen={onOpen}
            onSave={() => onSaveLink(link)}
          />
        ))}
    </div>
  )
}
