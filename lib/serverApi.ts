import type { TrailCollection } from './types'

/**
 * Server-only Semble fetches for metadata / OG image generation.
 *
 * Kept separate from lib/api.ts so route metadata never pulls in client code
 * (localStorage auth, mock data). Public collections need no auth, so these
 * calls run unauthenticated. Every function is best-effort: on any failure it
 * returns null and callers fall back to generic copy.
 */

const SEMBLE_BASE = process.env.NEXT_PUBLIC_SEMBLE_API_URL ?? 'https://api.semble.so/xrpc'
const USE_MOCK = Boolean(process.env.NEXT_PUBLIC_USE_MOCK)

interface CollectionPage {
  uri: string
  name: string
  description?: string
  author: { name: string; handle: string }
  urlCards?: { url: string; cardContent?: { url: string; title?: string } }[]
}

const recordKeyFromUri = (uri: string) => uri.split('/').pop() ?? uri

/**
 * Resolve a shared trail's collection for server rendering. Returns null in
 * mock mode (collections live in the browser) or on any request failure.
 */
export async function fetchTrailCollection(
  handleOrDid: string,
  recordKey: string
): Promise<TrailCollection | null> {
  if (USE_MOCK) return null
  try {
    const url = new URL(`${SEMBLE_BASE}/network.cosmik.collection.getByAtUri`)
    url.searchParams.set('handle', handleOrDid)
    url.searchParams.set('recordKey', recordKey)
    url.searchParams.set('limit', '100')
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const page = (await res.json()) as CollectionPage
    return {
      uri: page.uri,
      recordKey: recordKeyFromUri(page.uri),
      handle: page.author.handle,
      title: page.name,
      description: page.description ?? '',
      author: page.author.name || page.author.handle,
      links: (page.urlCards ?? []).map((c) => ({
        url: c.url,
        title: c.cardContent?.title || c.url,
        description: '',
        domain: '',
      })),
    }
  } catch {
    return null
  }
}
