'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Link, TrailOrigin } from '@/lib/types'
import { SEED_MAX, SEED_MIN } from '@/lib/types'
import { LinkCard } from './LinkCard'
import { Thumb } from './ui'
import styles from './Home.module.css'

/**
 * The calm landing. Before any walking begins, the user chooses ONE of two
 * ways to seed a trail:
 *   1. plant a question (free text + a rotating set of topic pills), which
 *      begins the walk straight away on the search-results pane, or
 *   2. seed with a handful of random links — which stays on this calm page,
 *      showing the drawn seeds to cycle/remove/refresh before walking.
 * For a shared trail, the shared collection sits at the top as the "root"
 * seed and the same two options appear below.
 */

// A broad pool of topics; a fresh window of six is shown on each refresh so the
// pills feel alive and invite exploration rather than prescribe it.
const TOPIC_POOL = [
  'rewilding the internet',
  'open social',
  'online community creation',
  'tools for thought',
  'agents collaborating',
  'knowledge commons',
  'calm technology',
  'open protocols',
  'sensemaking',
  'the commons',
  'personal knowledge gardens',
  'decentralised identity',
  'small web',
  'collective intelligence',
  'attention & focus',
  'local-first software',
  'digital gardens',
  'peer-to-peer',
]

const TOPICS_SHOWN = 6

function windowAt(offset: number): string[] {
  const out: string[] = []
  for (let i = 0; i < TOPICS_SHOWN; i++) out.push(TOPIC_POOL[(offset + i) % TOPIC_POOL.length])
  return out
}

export function Home({
  origin,
  seeds,
  onSeedQuery,
  onDrawRandom,
  onCycleSeed,
  onRemoveSeed,
  onAddSeed,
  onRefreshSeeds,
  onStartWalk,
  onWalkShared,
}: {
  origin?: TrailOrigin
  seeds: Link[]
  onSeedQuery: (query: string) => void
  onDrawRandom: () => void
  onCycleSeed: (i: number) => void
  onRemoveSeed: (i: number) => void
  onAddSeed: () => void
  onRefreshSeeds: () => void
  onStartWalk: () => void
  onWalkShared?: () => void
}) {
  // 'prompt' = choose a path; 'seeds' = review the drawn random links
  const [view, setView] = useState<'prompt' | 'seeds'>('prompt')

  const drawRandom = () => {
    onDrawRandom()
    setView('seeds')
  }

  return (
    <div className={styles.home}>
      <div className={styles.inner}>
        {view === 'seeds' && !origin ? (
          <RandomSeeds
            seeds={seeds}
            onBack={() => setView('prompt')}
            onCycle={onCycleSeed}
            onRemove={onRemoveSeed}
            onAdd={onAddSeed}
            onRefresh={onRefreshSeeds}
            onStart={onStartWalk}
          />
        ) : (
          <PromptView
            origin={origin}
            onSeedQuery={onSeedQuery}
            onDrawRandom={drawRandom}
            onWalkShared={onWalkShared}
          />
        )}
      </div>
    </div>
  )
}

/* ---- the prompt / choose-a-path view ---- */

function PromptView({
  origin,
  onSeedQuery,
  onDrawRandom,
  onWalkShared,
}: {
  origin?: TrailOrigin
  onSeedQuery: (query: string) => void
  onDrawRandom: () => void
  onWalkShared?: () => void
}) {
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  // start from a random spot in the pool so the pills differ each page load;
  // seeded in an effect (not initial state) to avoid an SSR hydration mismatch
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    setOffset(Math.floor(Math.random() * TOPIC_POOL.length))
  }, [])

  const topics = useMemo(() => windowAt(offset), [offset])

  const togglePick = (t: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const cycleTopics = () => {
    setOffset((o) => (o + TOPICS_SHOWN) % TOPIC_POOL.length)
    setPicked(new Set()) // picks referenced the old window; clear to avoid hidden selections
  }

  const query = [text.trim(), ...picked].filter(Boolean).join(' ')

  return (
    <>
      {origin ? (
        <SharedRoot origin={origin} />
      ) : (
        <header className={styles.intro}>
          <div className={styles.mark}>🌱</div>
          <h1 className={styles.title}>What&rsquo;s been on your mind lately?</h1>
          <p className={styles.sub}>Plant a question and let the network lead you somewhere.</p>
        </header>
      )}

      <section className={styles.query}>
        <input
          className={styles.input}
          placeholder={origin ? 'Or set off with your own question…' : 'Type anything…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query) onSeedQuery(query)
          }}
          autoFocus={!origin}
        />

        <div className={styles.topicsRow}>
          <div className={styles.topics}>
            {topics.map((t) => (
              <button
                key={t}
                className={`${styles.topic} ${picked.has(t) ? styles.topicOn : ''}`}
                onClick={() => togglePick(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button className={styles.cycle} title="Show other topics" onClick={cycleTopics}>
            ⟳
          </button>
        </div>

        <button className={styles.primary} disabled={!query} onClick={() => onSeedQuery(query)}>
          Begin walking →
        </button>
      </section>

      <div className={styles.or}>
        <span>or</span>
      </div>

      <section className={styles.random}>
        {origin ? (
          <button className={styles.secondary} onClick={onWalkShared}>
            Walk this trail as-is
          </button>
        ) : (
          <button className={styles.secondary} onClick={onDrawRandom}>
            🍃 Seed your trail with random links
          </button>
        )}
        <p className={styles.hint}>
          {origin
            ? 'Follow the links this trail already gathered, then wander onward.'
            : 'A fresh handful pulled from the network — cycle or swap them before you set off.'}
        </p>
      </section>
    </>
  )
}

/* ---- the random-seeds review view (still calm, still the home page) ---- */

function RandomSeeds({
  seeds,
  onBack,
  onCycle,
  onRemove,
  onAdd,
  onRefresh,
  onStart,
}: {
  seeds: Link[]
  onBack: () => void
  onCycle: (i: number) => void
  onRemove: (i: number) => void
  onAdd: () => void
  onRefresh: () => void
  onStart: () => void
}) {
  return (
    <>
      <header className={styles.intro}>
        <button className={styles.back} onClick={onBack}>
          ← Back to the prompt
        </button>
        <div className={styles.mark}>🍃</div>
        <h1 className={styles.title}>A handful to start from</h1>
        <p className={styles.sub}>Swap or remove any of these, then set off wandering.</p>
      </header>

      <section className={styles.seeds}>
        {seeds.map((s, i) => (
          <LinkCard
            key={s.url}
            link={s}
            variant="seed"
            onCycle={() => onCycle(i)}
            onRemove={seeds.length > SEED_MIN ? () => onRemove(i) : undefined}
          />
        ))}
        <div className={styles.seedRow}>
          {seeds.length < SEED_MAX && (
            <button className={styles.seedBtn} onClick={onAdd}>
              ＋ Add a seed
            </button>
          )}
          <button className={styles.seedBtn} onClick={onRefresh}>
            ⟳ Fresh handful
          </button>
        </div>
      </section>

      <button className={styles.primary} disabled={seeds.length < SEED_MIN} onClick={onStart}>
        Begin walking →
      </button>
    </>
  )
}

/** The shared collection shown as the trail's root seed on its landing page. */
function SharedRoot({ origin }: { origin: TrailOrigin }) {
  return (
    <header className={styles.sharedRoot}>
      <div className={styles.eyebrow}>⇗ A trail by {origin.author}</div>
      <h1 className={styles.title}>{origin.title}</h1>
      {origin.description && <p className={styles.sub}>{origin.description}</p>}
      <div className={styles.stack}>
        {origin.links.slice(0, 6).map((l: Link) => (
          <Thumb key={l.url} url={l.url} image={l.image} size={34} radius={9} className={styles.stackThumb} />
        ))}
        {origin.links.length > 6 && <span className={styles.more}>+{origin.links.length - 6}</span>}
      </div>
    </header>
  )
}
