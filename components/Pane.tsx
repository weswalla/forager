'use client'

import { useState } from 'react'
import type { Link, Rel, Related, TrailOrigin } from '@/lib/types'
import { REL_META, SEED_MAX, SEED_MIN } from '@/lib/types'
import { usePaneData, useSeedResults } from '@/lib/useApp'
import { LinkCard } from './LinkCard'
import { Thumb } from './ui'
import styles from './Pane.module.css'

const ALL_RELS: Rel[] = ['mutual', 'similar', 'connected']

/** Per-pane relationship toggles: all on by default, each toggles independently. */
function useRelFilter() {
  const [active, setActive] = useState<Set<Rel>>(() => new Set(ALL_RELS))
  const toggle = (r: Rel) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r)
      else next.add(r)
      return next
    })
  return { active, toggle }
}

/* ---- Filter pills — float over the top of the pane body ---- */

function FilterPills({ active, onToggle }: { active: Set<Rel>; onToggle: (r: Rel) => void }) {
  const defs: { key: Rel; label: string; swatch: string; onClass: string }[] = [
    { key: 'mutual', label: 'Mutual', swatch: REL_META.mutual.swatch, onClass: styles.onMutual },
    { key: 'similar', label: 'Similar', swatch: REL_META.similar.swatch, onClass: styles.onSimilar },
    { key: 'connected', label: 'Connected', swatch: REL_META.connected.swatch, onClass: styles.onConnected },
  ]
  return (
    <div className={styles.filters}>
      {defs.map((d) => (
        <button
          key={d.key}
          className={`${styles.pill} ${active.has(d.key) ? `${styles.on} ${d.onClass}` : ''}`}
          onClick={() => onToggle(d.key)}
        >
          <span className={styles.swatch} style={{ background: d.swatch }} />
          {d.label}
        </button>
      ))}
    </div>
  )
}

/* ---- Related list body: loading / error / filtered list ---- */

function RelatedList({
  data,
  error,
  retry,
  filter,
  exclude,
  label,
  onOpen,
}: {
  data: Related[] | null
  error: Error | null
  retry: () => void
  filter: Set<Rel>
  exclude: Set<string> // urls already in the trail — hidden from lists
  label: string
  onOpen: (link: Link) => void
}) {
  if (error) {
    return (
      <div className={styles.empty}>
        Couldn’t gather nearby links.
        <div>
          <button className={styles.miniBtn} onClick={retry}>↻ Try again</button>
        </div>
      </div>
    )
  }
  if (!data) return <div className={styles.empty}>Gathering nearby links…</div>

  const items = data.filter((r) => filter.has(r.rel) && !exclude.has(r.url))
  return (
    <>
      <div className={styles.listLabel}>{label}</div>
      {items.length === 0 ? (
        <div className={styles.empty}>No links in this thread yet.</div>
      ) : (
        <div className={styles.linkList}>
          {items.map((r, i) => (
            <LinkCard key={`${i}-${r.url}`} link={r} rel={r.rel} note={r.note} onClick={() => onOpen(r)} />
          ))}
        </div>
      )}
    </>
  )
}

function SeedStack({ seeds, size = 26 }: { seeds: Link[]; size?: number }) {
  return (
    <span className={styles.seedStack}>
      {seeds.map((s) => (
        <Thumb key={s.url} url={s.url} image={s.image} size={size} radius={8} className={styles.stackThumb} />
      ))}
    </span>
  )
}

/* ============================ Seed pane (child 0) ============================ */

const QUERY_TOPICS = [
  'tools for thought',
  'agents collaborating',
  'knowledge commons',
  'calm technology',
  'open protocols',
  'sensemaking',
]

/** "What's been on your mind lately?" — free text + topic chips → a search seed. */
function QuerySeedBox({ onPlant }: { onPlant: (query: string) => void }) {
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<Set<string>>(() => new Set())

  const togglePick = (t: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const query = [text.trim(), ...picked].filter(Boolean).join(' ')
  const plant = () => {
    if (!query) return
    onPlant(query)
    setText('')
    setPicked(new Set())
  }

  return (
    <div className={styles.queryBox}>
      <div className={styles.queryLabel}>Or ask the network —</div>
      <input
        className={styles.queryInput}
        placeholder="What’s been on your mind lately?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') plant() }}
      />
      <div className={styles.queryTopics}>
        {QUERY_TOPICS.map((t) => (
          <button
            key={t}
            className={`${styles.topic} ${picked.has(t) ? styles.topicOn : ''}`}
            onClick={() => togglePick(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <button className={styles.plantQuery} disabled={!query} onClick={plant}>
        🌱 Plant it as a seed
      </button>
    </div>
  )
}

export function SeedPane({
  seeds,
  started,
  onCycle,
  onRemove,
  onAdd,
  onRefreshAll,
  onQuerySeed,
  onStart,
}: {
  seeds: Link[]
  started: boolean
  onCycle: (i: number) => void
  onRemove: (i: number) => void
  onAdd: () => void
  onRefreshAll: () => void
  onQuerySeed: (query: string) => void
  onStart: () => void
}) {
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{started ? '🌱 Seeds · locked' : '🌱 Seed the trail'}</div>
        <div className={styles.headTitle}>
          {started ? 'Your starting seeds' : 'Pick your seed links to begin'}
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.featured}>
          {seeds.map((s, i) => (
            <LinkCard
              key={s.url}
              link={s}
              variant="seed"
              locked={started}
              onCycle={() => onCycle(i)}
              onRemove={seeds.length > SEED_MIN ? () => onRemove(i) : undefined}
            />
          ))}
          {!started && (
            <div className={styles.seedRow}>
              {seeds.length < SEED_MAX && (
                <button className={styles.addSeed} onClick={onAdd}>＋ Add a seed</button>
              )}
              <button className={styles.addSeed} onClick={onRefreshAll}>⟳ Fresh handful</button>
            </div>
          )}
        </div>
        {started ? (
          <div className={styles.seedNote}>
            Seeds are locked for this trail. Start a new trail to choose different seeds.
          </div>
        ) : (
          <>
            <QuerySeedBox onPlant={onQuerySeed} />
            <button className={styles.startWander} disabled={seeds.length < SEED_MIN} onClick={onStart}>
              Start wandering →
            </button>
            <div className={styles.seedNote}>
              Cycle (⟳) or remove seeds — keep 1 to 3. They become the roots of your walk.
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* ============ Shared-trail pane (child 0 for shared-origin sessions) ============ */

export function SharedTrailPane({ origin, onOpen }: { origin: TrailOrigin; onOpen: (link: Link) => void }) {
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>⇗ Shared trail · by {origin.author}</div>
        <div className={styles.headTitle}>{origin.title}</div>
        {origin.description && <div className={styles.sharedDesc}>{origin.description}</div>}
      </div>
      <div className={styles.body}>
        <div className={styles.listLabel}>The trail ↓</div>
        <div className={styles.linkList}>
          {origin.links.map((l, i) => (
            <div key={`${i}-${l.url}`} className={styles.sharedStep}>
              <span className={styles.stepNum}>{i + 1}</span>
              <div className={styles.sharedStepCard}>
                <LinkCard link={l} onClick={() => onOpen(l)} />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.seedNote}>
          A trail {origin.author} walked. Follow any link to start wandering from it.
        </div>
      </div>
    </section>
  )
}

/* ============================ Results pane (child 1) ============================ */

export function ResultsPane({
  seeds,
  exclude,
  onOpen,
}: {
  seeds: Link[]
  exclude: Set<string>
  onOpen: (link: Link) => void
}) {
  const { active, toggle } = useRelFilter()
  const { data, error, retry } = useSeedResults(seeds.map((s) => s.url))
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>◷ From your seeds</div>
        <div className={styles.resultsTitle}>
          <SeedStack seeds={seeds} />
          <span>Where {seeds.length} seed{seeds.length === 1 ? '' : 's'} lead</span>
        </div>
      </div>
      <div className={styles.body}>
        <FilterPills active={active} onToggle={toggle} />
        <RelatedList data={data} error={error} retry={retry} filter={active} exclude={exclude} label="Branching out →" onOpen={onOpen} />
      </div>
    </section>
  )
}

/* ============================ Link pane (child i+2) ============================ */

export function LinkPane({
  link,
  step,
  exclude,
  onOpen,
}: {
  link: Link
  step: number
  exclude: Set<string>
  onOpen: (link: Link) => void
}) {
  const { active, toggle } = useRelFilter()
  const { data, error, retry } = usePaneData(link.url)
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>◷ Step {step}</div>
        <LinkCard
          link={link}
          variant="header"
          onClick={() =>
            window.open(`https://semble.so/url?id=${encodeURIComponent(link.url)}`, '_blank', 'noopener')
          }
        />
      </div>
      <div className={styles.body}>
        <FilterPills active={active} onToggle={toggle} />
        <RelatedList data={data} error={error} retry={retry} filter={active} exclude={exclude} label="Where this leads →" onOpen={onOpen} />
      </div>
    </section>
  )
}
