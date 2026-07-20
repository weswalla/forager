import type { Metadata } from 'next'
import { App } from '@/components/App'
import { fetchTrailCollection } from '@/lib/serverApi'

type Params = Promise<{ handle: string; rkey: string }>

/**
 * Per-trail meta. When the collection resolves server-side we fill the real
 * title, author, and stop count; otherwise (mock mode, private, or a fetch
 * failure) we fall back to generic copy keyed off the handle in the URL.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle: rawHandle, rkey } = await params
  const handle = decodeURIComponent(rawHandle)
  const collection = await fetchTrailCollection(handle, rkey)

  const author = collection?.author || `@${handle}`
  const stops = collection?.links.length ?? 0
  const stopsLabel = stops ? `${stops} stop${stops === 1 ? '' : 's'} on Semble` : 'a walked trail of links on Semble'

  const title = collection?.title
    ? `${collection.title} — a trail on Forager`
    : `A trail by @${handle} — on Forager`
  const description = collection?.description
    ? `${collection.description} · Curated by ${author} · ${stopsLabel}`
    : `Curated by ${author} · ${stopsLabel}. Wander from this trail, or start your own.`

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      siteName: 'Forager',
      url: `/user/${handle}/trail/${rkey}`,
      title,
      description,
      authors: [`@${handle}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

/** Share link: {app_url}/user/{handle or did}/trail/{recordKey} */
export default async function SharedTrailPage({ params }: { params: Params }) {
  const { handle, rkey } = await params
  return <App route={{ kind: 'shared', handleOrDid: decodeURIComponent(handle), recordKey: rkey }} />
}
