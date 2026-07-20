import type { Metadata } from 'next'
import { App } from '@/components/App'

type Params = Promise<{ id: string }>

// A trail in progress is local to the browser that walked it — nothing to
// resolve server-side, so keep it out of search results.
export const metadata: Metadata = {
  title: 'A trail on Forager',
  robots: { index: false },
}

/** A trail being walked in this browser: {app_url}/trail/{id} */
export default async function TrailPage({ params }: { params: Params }) {
  const { id } = await params
  return <App route={{ kind: 'trail', id }} />
}
