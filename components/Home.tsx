'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Link, TrailOrigin } from '@/lib/types'
import { searchQueryOf } from '@/lib/helpers'
import { LinkCard } from './LinkCard'
import styles from './Home.module.css'

/**
 * The calm landing. Before any walking begins, the user chooses ONE of two
 * ways to seed a trail:
 *   1. plant a question (free text + a rotating set of topic pills), or
 *   2. seed with a single random link (a fresh one on every tap).
 * Either choice begins the walk straight away. For a shared trail, the shared
 * collection sits at the top as the "root" seed and clicking a link walks from it.
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

const TOPICS_SHOWN = 4

function windowAt(offset: number): string[] {
  const out: string[] = []
  for (let i = 0; i < TOPICS_SHOWN; i++) out.push(TOPIC_POOL[(offset + i) % TOPIC_POOL.length])
  return out
}

export function Home({
  origin,
  seeds,
  onSeedQuery,
  onSeedRandom,
  onStartWalk,
  onWalkFrom,
}: {
  origin?: TrailOrigin
  seeds: Link[]
  onSeedQuery: (query: string) => void
  onSeedRandom: () => void
  onStartWalk: () => void
  onWalkFrom?: (link: Link) => void
}) {
  return (
    <div className={styles.home}>
      <div className={styles.inner}>
        <PromptView
          origin={origin}
          seeds={seeds}
          onSeedQuery={onSeedQuery}
          onSeedRandom={onSeedRandom}
          onStartWalk={onStartWalk}
          onWalkFrom={onWalkFrom}
        />
      </div>
    </div>
  )
}

/* ---- the prompt / choose-a-path view ---- */

function PromptView({
  origin,
  seeds,
  onSeedQuery,
  onSeedRandom,
  onStartWalk,
  onWalkFrom,
}: {
  origin?: TrailOrigin
  seeds: Link[]
  onSeedQuery: (query: string) => void
  onSeedRandom: () => void
  onStartWalk: () => void
  onWalkFrom?: (link: Link) => void
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

  // A random seed the user planted for preview: a single, non-search seed. (A
  // fresh trail carries 3 default seeds; a question carries one search seed.)
  const randomSeed = seeds.length === 1 && !searchQueryOf(seeds[0].url) ? seeds[0] : null

  // A shared trail's landing is just its links — click one to start wandering.
  if (origin) return <SharedRoot origin={origin} onWalkFrom={onWalkFrom} />

  return (
    <>
      <header className={styles.intro}>
        <div className={styles.mark}>🌱</div>
        <h1 className={styles.title}>What&rsquo;s been on your mind lately?</h1>
        <p className={styles.sub}>Plant a question and let the network lead you somewhere.</p>
      </header>

      <section className={styles.query}>
        <input
          className={styles.input}
          placeholder="Type anything…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query) onSeedQuery(query)
          }}
          autoFocus
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
          Start wandering →
        </button>
      </section>

      <div className={styles.or}>
        <span>or</span>
      </div>

      <section className={styles.random}>
        {randomSeed ? (
          <div className={styles.preview}>
            <LinkCard link={randomSeed} onClick={onStartWalk} />
            <div className={styles.previewActions}>
              <button className={styles.reroll} onClick={onSeedRandom}>
                ⟳ Try another
              </button>
              <button className={styles.primary} onClick={onStartWalk}>
                Start wandering →
              </button>
            </div>
            <p className={styles.hint}>Start from this link, or reroll for a different one.</p>
          </div>
        ) : (
          <>
            <button className={styles.secondary} onClick={onSeedRandom}>
              🍃 Seed your trail with a random link
            </button>
            <p className={styles.hint}>
              One link plucked from the network — tap again for a different starting point.
            </p>
          </>
        )}
      </section>
    </>
  )
}

/**
 * The shared collection at the top of its landing page: the trail's title and
 * every link listed in full. Clicking any link starts a walk from it.
 */
function SharedRoot({ origin, onWalkFrom }: { origin: TrailOrigin; onWalkFrom?: (link: Link) => void }) {
  return (
    <header className={styles.sharedRoot}>
      <div className={styles.eyebrow}>⇗ A trail by {origin.author}</div>
      <h1 className={styles.title}>{origin.title}</h1>
      {origin.description && <p className={styles.sub}>{origin.description}</p>}
      <p className={styles.sharedHint}>Click any link to start wandering from this trail.</p>
      <div className={styles.sharedLinks}>
        {origin.links.map((l: Link) => (
          <LinkCard key={l.url} link={l} onClick={onWalkFrom ? () => onWalkFrom(l) : undefined} />
        ))}
      </div>
    </header>
  )
}
