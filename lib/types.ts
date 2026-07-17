export type Rel = 'mutual' | 'similar' | 'connected'

export interface Link {
  url: string // identity
  title: string
  description: string
  domain: string
  image?: string // else gradient+emoji placeholder
}

export interface Related extends Link {
  rel: Rel
  note?: string // connection note (for 'connected')
}

export interface Trail {
  id: string
  title: string // default "Trail · <date>"
  description: string // default <date>
  seeds: Link[] // 1–3, locked once started (for shared-origin trails: all origin links)
  started: boolean
  path: Link[] // ordered links after the seeds
  createdAt: string
  collection?: CollectionRef // set once the trail is saved to Semble; enables sharing
  origin?: TrailOrigin // present when this trail was opened from a shared link
}

/** Where a trail lives on Semble once saved as a collection. */
export interface CollectionRef {
  uri: string // at://{did}/{collection-nsid}/{recordKey}
  recordKey: string
  handle: string
  url: string // /user/{handle}/trail/{recordKey}
}

/** The shared collection a session was opened from (fetched via its AT-URI). */
export interface TrailOrigin {
  uri: string
  title: string
  description: string
  author: string
  links: Link[]
}

export interface Profile {
  handle: string
  displayName: string
  avatar?: string
}

/** A trail collection resolved from a share link. */
export interface TrailCollection {
  uri: string
  recordKey: string
  handle: string
  title: string
  description: string
  author: string
  links: Link[] // ordered: seeds first, then the walked path
}

export const SEED_MIN = 1
export const SEED_MAX = 3

export const REL_META: Record<Rel, { label: string; icon: string; swatch: string }> = {
  mutual: { label: 'Mutual', icon: '⬡', swatch: 'var(--accent-2)' },
  similar: { label: 'Similar', icon: '≈', swatch: 'var(--sage)' },
  connected: { label: 'Connected', icon: '↔', swatch: 'var(--dusty)' },
}
