import type { Metadata } from 'next'
import { App } from '@/components/App'

type Params = Promise<{ handle: string; rkey: string }>

/**
 * Per-trail meta (docs/open_graph). In mock mode the collection lives in
 * localStorage, so the server only knows the sharer's handle from the URL;
 * the real impl would fetch the collection here (get_collection_by_aturi)
 * and use its title + stop count.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle: rawHandle, rkey } = await params
  const handle = decodeURIComponent(rawHandle)
  const title = 'A trail on Forager'
  const description = `Curated by @${handle} · a walked trail of links on Semble`
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
  return <App shared={{ handleOrDid: decodeURIComponent(handle), recordKey: rkey }} />
}
