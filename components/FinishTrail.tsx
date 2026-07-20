'use client'

import { useMemo, useState } from 'react'
import type { Link, Profile, Trail, TrailHighlight } from '@/lib/types'
import { blueskyShareUrl, dedupeByUrl } from '@/lib/helpers'
import { Bear } from './Bear'
import { LinkCard } from './LinkCard'
import { Thumb } from './ui'
import styles from './FinishTrail.module.css'

/**
 * The end of a walk. The trail is shown as a vertical list; an optional
 * "pairing" reflection asks which two links stood out (and why); then a
 * name/describe form publishes it to Semble and offers a share to Bluesky.
 */
export function FinishTrail({
  trail,
  profile,
  pending,
  error,
  onPublish,
  onClose,
}: {
  trail: Trail
  profile: Profile | null
  pending: boolean
  error: string | null
  // publish returns the shareable URL (path) so we can offer Bluesky/copy
  onPublish: (info: {
    title: string
    description: string
    highlight: TrailHighlight | undefined
  }) => Promise<string | null>
  onClose: () => void
}) {
  // the walk, in order: root (seeds or shared origin) then each step
  const links = useMemo(() => {
    const root = trail.origin ? trail.origin.links : trail.seeds
    return dedupeByUrl([...root, ...trail.path])
  }, [trail])

  const [title, setTitle] = useState(trail.title)
  const [description, setDescription] = useState(trail.description)
  // pairing: up to two selected urls + a note
  const [picked, setPicked] = useState<string[]>(trail.highlight?.urls ?? [])
  const [note, setNote] = useState(trail.highlight?.note ?? '')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const togglePick = (url: string) =>
    setPicked((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url)
      if (prev.length >= 2) return [prev[1], url] // keep the most recent two
      return [...prev, url]
    })

  const published = Boolean(trail.collection) || Boolean(shareUrl)

  const buildHighlight = (): TrailHighlight | undefined =>
    picked.length === 2 && note.trim()
      ? { urls: [picked[0], picked[1]], note: note.trim() }
      : undefined

  const handlePublish = async () => {
    const url = await onPublish({ title, description, highlight: buildHighlight() })
    if (url) setShareUrl(url.startsWith('http') ? url : `${location.origin}${url}`)
  }

  const fullShareUrl = shareUrl ?? (trail.collection ? `${location.origin}${trail.collection.url}` : null)

  const copyLink = () => {
    if (!fullShareUrl) return
    navigator.clipboard.writeText(fullShareUrl).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      },
      () => {}
    )
  }

  const bskyText = `I walked a trail on Forager${title ? `: “${title}”` : ''} 🌿`

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <button className={styles.back} onClick={onClose}>
          ← Back to the walk
        </button>
        <Bear kind="forage" size={54} />
        <h1 className={styles.title}>
          {published ? 'Your trail is live ✦' : 'Finish your trail'}
        </h1>
        <p className={styles.sub}>
          {published
            ? 'Published to Semble as a collection. Share it so others can wander from it.'
            : 'A look back at where you wandered — name it, add a reflection, then publish.'}
        </p>
      </header>

      <div className={styles.columns}>
        {/* the walk as a vertical list */}
        <section className={styles.walk}>
          <div className={styles.sectionLabel}>The trail · {links.length} links</div>
          <div className={styles.list}>
            {links.map((l, i) => (
              <PickableCard
                key={l.url}
                link={l}
                index={i + 1}
                selectable={!published}
                selected={picked.includes(l.url)}
                pairIndex={picked.indexOf(l.url)}
                onToggle={() => togglePick(l.url)}
              />
            ))}
          </div>
        </section>

        {/* pairing reflection + publish/share form */}
        <section className={styles.side}>
          {!published && (
            <div className={styles.pairing}>
              <div className={styles.sectionLabel}>Pairing · optional</div>
              <p className={styles.pairPrompt}>
                Which two links had the most unlikely connection — or stood out most? Pick two from
                the trail, then say a word about why.
              </p>
              <div className={styles.pickedRow}>
                {[0, 1].map((slot) => {
                  const url = picked[slot]
                  const link = url ? links.find((l) => l.url === url) : undefined
                  return (
                    <div key={slot} className={`${styles.slot} ${link ? styles.slotFull : ''}`}>
                      {link ? (
                        <>
                          <Thumb url={link.url} image={link.image} size={26} radius={7} />
                          <span className={styles.slotTitle}>{link.title}</span>
                        </>
                      ) : (
                        <span className={styles.slotEmpty}>Pick link {slot + 1}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <textarea
                className={styles.noteInput}
                rows={3}
                placeholder="What connects them? What stood out?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={picked.length < 2}
              />
            </div>
          )}

          {published && trail.highlight && <HighlightNote links={links} highlight={trail.highlight} />}

          {!published ? (
            <div className={styles.form}>
              <div className={styles.sectionLabel}>Name your trail</div>
              <label className={styles.fieldLabel}>Title</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.publish}
                disabled={pending || !title.trim()}
                onClick={handlePublish}
              >
                {pending ? 'Publishing…' : profile ? '✦ Publish trail to Semble' : '✦ Sign in & publish'}
              </button>
            </div>
          ) : (
            <div className={styles.shareBox}>
              <a
                className={styles.bsky}
                href={fullShareUrl ? blueskyShareUrl(bskyText, fullShareUrl) : '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                🦋 Share to Bluesky
              </a>
              <button className={styles.copy} onClick={copyLink}>
                {copied ? '✓ Link copied' : '⇗ Copy share link'}
              </button>
              <button className={styles.done} onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PickableCard({
  link,
  index,
  selectable,
  selected,
  pairIndex,
  onToggle,
}: {
  link: Link
  index: number
  selectable: boolean
  selected: boolean
  pairIndex: number
  onToggle: () => void
}) {
  return (
    <div className={styles.step}>
      <span className={styles.stepNum}>{index}</span>
      <div
        className={`${styles.card} ${selected ? styles.cardSelected : ''} ${
          selectable ? styles.cardSelectable : ''
        }`}
        onClick={selectable ? onToggle : undefined}
        role={selectable ? 'button' : undefined}
        tabIndex={selectable ? 0 : undefined}
        onKeyDown={selectable ? (e) => { if (e.key === 'Enter') onToggle() } : undefined}
      >
        {selected && <span className={styles.pairBadge}>{pairIndex + 1}</span>}
        <LinkCard link={link} />
      </div>
    </div>
  )
}

function HighlightNote({ links, highlight }: { links: Link[]; highlight: TrailHighlight }) {
  const paired = highlight.urls.map((u) => links.find((l) => l.url === u)).filter(Boolean) as Link[]
  return (
    <div className={styles.highlightNote}>
      <div className={styles.sectionLabel}>The pairing you noted</div>
      <div className={styles.pickedRow}>
        {paired.map((l) => (
          <div key={l.url} className={`${styles.slot} ${styles.slotFull}`}>
            <Thumb url={l.url} image={l.image} size={26} radius={7} />
            <span className={styles.slotTitle}>{l.title}</span>
          </div>
        ))}
      </div>
      <p className={styles.highlightText}>“{highlight.note}”</p>
    </div>
  )
}
