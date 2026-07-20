'use client'

import type { Link, Related, TrailOrigin } from '@/lib/types'
import { usePaneData, useSeedResults } from '@/lib/useApp'
import { searchQueryOf } from '@/lib/helpers'
import { LinkCard } from './LinkCard'
import { Thumb } from './ui'
import styles from './Pane.module.css'

/* ---- Related list body: loading / error / list ---- */

function RelatedList({
  data,
  error,
  retry,
  exclude,
  onOpen,
}: {
  data: Related[] | null
  error: Error | null
  retry: () => void
  exclude: Set<string> // urls already in the trail — hidden from lists
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

  const items = data.filter((r) => !exclude.has(r.url))
  return (
    <>
      {items.length === 0 ? (
        <div className={styles.empty}>No links in this thread yet.</div>
      ) : (
        <div className={styles.linkList}>
          {items.map((r, i) => (
            <LinkCard key={`${i}-${r.url}`} link={r} note={r.note} onClick={() => onOpen(r)} />
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
  const { data, error, retry } = useSeedResults(seeds.map((s) => s.url))
  // a trail seeded by a single question — reflect the query in the header
  const query = seeds.length === 1 ? searchQueryOf(seeds[0].url) : null
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{query ? '◷ From your question' : '◷ From your seeds'}</div>
        {query ? (
          <div className={styles.resultsTitle}>
            <span>Where “{query}” leads</span>
          </div>
        ) : (
          <div className={styles.resultsTitle}>
            <SeedStack seeds={seeds} />
            <span>Where {seeds.length} seed{seeds.length === 1 ? '' : 's'} lead</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <RelatedList data={data} error={error} retry={retry} exclude={exclude} onOpen={onOpen} />
      </div>
    </section>
  )
}

/* ============================ Link pane (child i+2) ============================ */

export function LinkPane({
  link,
  exclude,
  onOpen,
}: {
  link: Link
  exclude: Set<string>
  onOpen: (link: Link) => void
}) {
  const { data, error, retry } = usePaneData(link.url)
  return (
    <section className={styles.pane}>
      <div className={styles.head}>
        <LinkCard
          link={link}
          variant="header"
          onClick={() =>
            window.open(`https://semble.so/url?id=${encodeURIComponent(link.url)}`, '_blank', 'noopener')
          }
        />
      </div>
      <div className={styles.body}>
        <RelatedList data={data} error={error} retry={retry} exclude={exclude} onOpen={onOpen} />
      </div>
    </section>
  )
}
