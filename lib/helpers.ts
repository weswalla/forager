import type { Link, Related } from './types'

/**
 * path index -> pane child index. Seed selection happens on the home page, so
 * the walk has no seed pane: child 0 is the "root" (the results pane for an
 * ordinary trail, or the shared-trail pane for a shared one) and walked steps
 * follow from 1.
 */
export const PANE_ROOT = 0
export const paneOfStep = (i: number) => i + 1

export function newId(prefix = 't'): string {
  return prefix + Math.random().toString(36).slice(2, 10)
}

export function today(): string {
  return new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Alternate mutual/similar/connected so the "All" list mixes relationship kinds. */
export function interweave(m: Related[], s: Related[], c: Related[]): Related[] {
  const out: Related[] = []
  const max = Math.max(m.length, s.length, c.length)
  for (let i = 0; i < max; i++) {
    if (m[i]) out.push(m[i])
    if (s[i]) out.push(s[i])
    if (c[i]) out.push(c[i])
  }
  return out
}

/**
 * Interleave by weighted random draw, preserving each list's internal order.
 * Connections get a slight bias toward the top of the combined list.
 */
export function weightedInterleave(m: Related[], s: Related[], c: Related[]): Related[] {
  const lists = [
    { items: [...c], w: 0.4 }, // connected — slight bias
    { items: [...m], w: 0.3 },
    { items: [...s], w: 0.3 },
  ]
  const out: Related[] = []
  for (;;) {
    const avail = lists.filter((l) => l.items.length)
    if (!avail.length) return out
    const total = avail.reduce((a, l) => a + l.w, 0)
    let r = Math.random() * total
    let pick = avail[avail.length - 1]
    for (const l of avail) {
      r -= l.w
      if (r <= 0) {
        pick = l
        break
      }
    }
    out.push(pick.items.shift()!)
  }
}

/* ---- query seeds: a Semble card search planted as a seed link ---- */

export const SEMBLE_SEARCH_BASE = 'https://semble.so/search/cards'

/** Build a seed link representing a Semble card search for `query`. */
export function searchSeedLink(query: string): Link {
  const q = query.trim().replace(/\s+/g, ' ')
  return {
    url: `${SEMBLE_SEARCH_BASE}?query=${encodeURIComponent(q).replace(/%20/g, '+')}`,
    title: `“${q}”`,
    description: 'A question planted as a seed — nearby links come from Semble search.',
    domain: 'semble.so',
  }
}

/** The query of a search-seed url, or null for ordinary links. */
export function searchQueryOf(url: string): string | null {
  if (!url.startsWith(SEMBLE_SEARCH_BASE)) return null
  try {
    return new URL(url).searchParams.get('query')
  } catch {
    return null
  }
}

/** Dedupe by url; the first occurrence (and its rel) wins. */
export function dedupeByUrl<T extends Link>(links: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const l of links) {
    if (seen.has(l.url)) continue
    seen.add(l.url)
    out.push(l)
  }
  return out
}

/* ---- Placeholder art: deterministic gradient + emoji per url ---- */

const PALETTES: [string, string][] = [
  ['#c8734b', '#e0a26a'],
  ['#8a9a6f', '#b4c08d'],
  ['#9a8ba8', '#c3b3d1'],
  ['#5f8a86', '#8fbdb6'],
  ['#c98a6b', '#e8b98f'],
  ['#b5794f', '#d9a86f'],
  ['#7b8f9e', '#a9c0cd'],
  ['#a86f6f', '#cf9c95'],
]
const EMOJI = ['🍃', '📜', '🌿', '🕯️', '🗺️', '🪶', '🧭', '🌾', '📖', '☕', '🏞️', '🎐', '🪵', '🌙', '🔭', '🫖']

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function thumbFor(url: string): { gradient: string; emoji: string } {
  const h = hash(url)
  const p = PALETTES[h % PALETTES.length]
  return {
    gradient: `linear-gradient(140deg,${p[0]},${p[1]})`,
    emoji: EMOJI[h % EMOJI.length],
  }
}
