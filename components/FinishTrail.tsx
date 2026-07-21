'use client'

import { useMemo, useState } from 'react'
import type { Curator, Link, Profile, Trail } from '@/lib/types'
import { blueskyShareUrl, dedupeByUrl } from '@/lib/helpers'
import { useCurators } from '@/lib/useApp'
import { Bear } from './Bear'
import { LinkCard } from './LinkCard'
import styles from './FinishTrail.module.css'

/**
 * The end of a walk, as a calm two-step flow:
 *   1. Review  — scroll the trail (remove any step) and see who curated the links.
 *   2. Publish — name & describe, publish to Semble, then share to Bluesky with a
 *      live preview of the post (text + link embed) before posting.
 * A published trail is read-only and jumps straight to the share step.
 */
type Step = 'review' | 'publish'

export function FinishTrail({
  trail,
  profile,
  pending,
  error,
  onRemoveStep,
  onPublish,
  onClose,
}: {
  trail: Trail
  profile: Profile | null
  pending: boolean
  error: string | null
  // remove a walked step (by path index) from the trail while reviewing
  onRemoveStep: (index: number) => void
  // publish returns the shareable URL (path) so we can offer Bluesky/copy
  onPublish: (info: { title: string; description: string }) => Promise<string | null>
  onClose: () => void
}) {
  // the walk, in order: root (seeds or shared origin) then each step. Path steps
  // carry their path index so the review step can remove them.
  const { rootLinks, steps } = useMemo(() => {
    const root = trail.origin ? trail.origin.links : trail.seeds
    const seen = new Set(root.map((l) => l.url))
    const steps = trail.path
      .map((l, i) => ({ link: l, pathIndex: i }))
      .filter((s) => {
        if (seen.has(s.link.url)) return false
        seen.add(s.link.url)
        return true
      })
    return { rootLinks: dedupeByUrl(root), steps }
  }, [trail])

  const links = useMemo(
    () => dedupeByUrl([...rootLinks, ...steps.map((s) => s.link)]),
    [rootLinks, steps]
  )

  // a representative image for the share embed: the first link that has one
  const embedImage = useMemo(() => links.find((l) => l.image)?.image, [links])

  const published = Boolean(trail.collection)

  const [step, setStep] = useState<Step>(published ? 'publish' : 'review')
  const [title, setTitle] = useState(trail.title)
  const [description, setDescription] = useState(trail.description)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // editable Bluesky post text, shown live in the preview before posting
  const [postText, setPostText] = useState('')

  const isLive = published || Boolean(shareUrl)

  const handlePublish = async () => {
    const url = await onPublish({ title, description })
    if (url) {
      setShareUrl(url.startsWith('http') ? url : `${location.origin}${url}`)
      // seed the share text from the published title
      setPostText(`I walked a trail on Forager${title ? `: “${title}”` : ''} 🌿`)
    }
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

  const heading = isLive
    ? { title: 'Your trail is live ✦', sub: 'Published to Semble. Post it to Bluesky below — here’s how it’ll look.' }
    : step === 'review'
      ? { title: 'Review your trail', sub: 'Scroll back through where you wandered and see who curated these links.' }
      : { title: 'Name & publish', sub: 'Give your trail a title and a few words, then publish it to Semble and share it.' }

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <button className={styles.back} onClick={onClose}>
          ← Back to the walk
        </button>
        <Bear kind="forage" size={54} />
        <h1 className={styles.title}>{heading.title}</h1>
        <p className={styles.sub}>{heading.sub}</p>
        {!isLive && <Steps current={step} />}
      </header>

      <div className={styles.flow}>
        {/* ---- Step 1: review — trail + curators ---- */}
        {!isLive && step === 'review' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionLabel}>The trail · {links.length} links</div>
              <div className={styles.list}>
                {rootLinks.map((l, i) => (
                  <ReviewCard key={l.url} link={l} index={i + 1} />
                ))}
                {steps.map((s, i) => (
                  <ReviewCard
                    key={s.link.url}
                    link={s.link}
                    index={rootLinks.length + i + 1}
                    onRemove={() => onRemoveStep(s.pathIndex)}
                  />
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionLabel}>Curated by these people</div>
              <Curators urls={links.map((l) => l.url)} />
            </section>

            <button className={styles.next} onClick={() => setStep('publish')}>
              Approve & continue →
            </button>
          </>
        )}

        {/* ---- Step 2: publish ---- */}
        {!isLive && step === 'publish' && (
          <section className={styles.panel}>
            <div className={styles.form}>
              <label className={styles.fieldLabel}>Title</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.navRow}>
                <button className={styles.secondary} onClick={() => setStep('review')}>
                  ← Back
                </button>
                <button
                  className={styles.publish}
                  disabled={pending || !title.trim()}
                  onClick={handlePublish}
                >
                  {pending ? 'Publishing…' : profile ? '✦ Publish to Semble' : '✦ Sign in & publish'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ---- Live: share to Bluesky with a live post preview ---- */}
        {isLive && (
          <section className={styles.panel}>
            <div className={styles.sectionLabel}>Share to Bluesky</div>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Say something about your trail…"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className={styles.previewLabel}>Preview</div>
            <BlueskyPreview
              profile={profile}
              text={postText}
              title={title}
              description={description}
              url={fullShareUrl}
              image={embedImage}
            />
            <div className={styles.shareBox}>
              <a
                className={styles.bsky}
                href={fullShareUrl ? blueskyShareUrl(postText, fullShareUrl) : '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                🦋 Post to Bluesky
              </a>
              <button className={styles.copy} onClick={copyLink}>
                {copied ? '✓ Link copied' : '⇗ Copy share link'}
              </button>
              <button className={styles.done} onClick={onClose}>
                Done
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/** The two flow steps as a small progress indicator. */
function Steps({ current }: { current: Step }) {
  const order: Step[] = ['review', 'publish']
  const labels: Record<Step, string> = { review: 'Review', publish: 'Publish & share' }
  return (
    <ol className={styles.steps}>
      {order.map((s, i) => {
        const state =
          s === current ? styles.stepOn : order.indexOf(current) > i ? styles.stepDone : ''
        return (
          <li key={s} className={`${styles.stepPip} ${state}`}>
            <span className={styles.stepPipNum}>{i + 1}</span>
            {labels[s]}
          </li>
        )
      })}
    </ol>
  )
}

function ReviewCard({
  link,
  index,
  onRemove,
}: {
  link: Link
  index: number
  onRemove?: () => void
}) {
  return (
    <div className={styles.step}>
      <span className={styles.stepNum}>{index}</span>
      <div className={styles.card}>
        <LinkCard link={link} onRemove={onRemove} />
      </div>
    </div>
  )
}

/**
 * A faithful preview of the Bluesky post: the author, the composed text, and an
 * external-link embed card (title, description, domain, optional thumbnail) —
 * the same embed Bluesky renders for the shared trail URL.
 */
function BlueskyPreview({
  profile,
  text,
  title,
  description,
  url,
  image,
}: {
  profile: Profile | null
  text: string
  title: string
  description: string
  url: string | null
  image?: string
}) {
  let domain = 'semble.so'
  try {
    if (url) domain = new URL(url).hostname
  } catch {
    /* keep default */
  }
  return (
    <div className={styles.bskyPreview}>
      <div className={styles.bskyHead}>
        {profile?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.bskyAvatar} src={profile.avatar} alt="" />
        ) : (
          <span className={styles.bskyAvatar}>
            <Bear kind="head" palette="sage" size={36} />
          </span>
        )}
        <div className={styles.bskyName}>
          <span className={styles.bskyDisplay}>{profile?.displayName ?? 'You'}</span>
          <span className={styles.bskyHandle}>@{profile?.handle ?? 'you.bsky.social'}</span>
        </div>
      </div>
      {text.trim() && <p className={styles.bskyText}>{text}</p>}
      <div className={styles.bskyEmbed}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.bskyEmbedImg} src={image} alt="" />
        ) : (
          <div className={styles.bskyEmbedThumb}>
            <Bear kind="forage" size={40} />
          </div>
        )}
        <div className={styles.bskyEmbedBody}>
          <span className={styles.bskyEmbedTitle}>{title || 'A trail on Forager'}</span>
          {description.trim() && <span className={styles.bskyEmbedDesc}>{description}</span>}
          <span className={styles.bskyEmbedDomain}>{domain}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * "The links in this trail have been curated by these people" — everyone who
 * has saved any of the trail's links to their Semble library, deduplicated.
 */
function Curators({ urls }: { urls: string[] }) {
  const curators = useCurators(urls)

  if (curators === null) return <p className={styles.curatorsLoading}>Gathering curators…</p>
  if (curators.length === 0)
    return <p className={styles.curatorsLoading}>No curators found for these links yet.</p>

  return (
    <ul className={styles.curatorList}>
      {curators.map((c) => (
        <li key={c.handle} className={styles.curator}>
          <a
            className={styles.curatorLink}
            href={`https://semble.so/profile/${c.handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CuratorAvatar curator={c} />
            <span className={styles.curatorText}>
              <span className={styles.curatorName}>{c.displayName}</span>
              <span className={styles.curatorHandle}>@{c.handle}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function CuratorAvatar({ curator }: { curator: Curator }) {
  if (curator.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.curatorAvatar} src={curator.avatar} alt="" />
  }
  return (
    <span className={styles.curatorAvatar}>
      <Bear kind="head" palette="sage" size={30} />
    </span>
  )
}

