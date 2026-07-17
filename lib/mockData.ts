import type { Link, Rel, Related } from './types'

const RAW: [string, string, string][] = [
  ['The Slow Web Movement', 'On building calmer, human-paced digital spaces that respect attention.', 'slowweb.org'],
  ['Notes on Forest Bathing', 'How shinrin-yoku restores focus and lowers the noise of the mind.', 'kinfolk.com'],
  ['A Field Guide to Wandering', 'Wayfinding without maps — trusting the path as it unfolds.', 'longreads.com'],
  ['The Garden and the Stream', 'Two metaphors for how we organize what we learn online.', 'hapgood.us'],
  ['Tools for Thought', 'A survey of software that helps us think in public and private.', 'tft.io'],
  ['On Keeping a Commonplace Book', 'The centuries-old practice of collecting fragments worth remembering.', 'austinkleon.com'],
  ['Digital Gardens Explained', 'Why more people are tending public knowledge gardens.', 'maggieappleton.com'],
  ['The Cozy Web', 'The soft, private middle layer between the open web and the void.', 'venkatesh.rao'],
  ['Wabi-Sabi for Interfaces', 'Designing for warmth, imperfection, and quiet delight.', 'designnotes.co'],
  ['Serendipity Engines', 'How the best browsing feels like a lucky walk in the woods.', 'increment.com'],
  ['Reading in the Age of Feeds', 'Reclaiming long attention from the scroll.', 'newyorker.com'],
  ['The Memex Revisited', "Vannevar Bush's dream of associative trails, seventy years on.", 'theatlantic.com'],
  ['Trailblazing & Association', 'Following links the way memory actually works.', 'brainpickings.org'],
  ['A Pattern Language for Notes', 'Small composable structures for a lifetime of thinking.', 'patterns.dev'],
  ['The Ecology of Attention', 'Attention as a shared, cultivated commons.', 'aeon.co'],
  ['Handmade Software', 'In praise of tools made with care, by hand, for few.', 'handmade.network'],
  ['Quiet Corners of the Internet', 'A directory of calm, ad-free, lovingly-made websites.', 'quietplaces.web'],
  ['On Curation as Craft', 'Choosing well is its own creative act.', 'aperture.org'],
  ['The Long Now of Reading', 'Books and links that reward returning years later.', 'longnow.org'],
  ['Paths Through the Archive', 'Designing browsing that invites rather than optimizes.', 'walkerart.org'],
  ['Moss, Lichen & Slow Growth', 'What tiny organisms teach about patient accumulation.', 'emergence.mag'],
  ['The Well-Tended Bookmark', 'Bookmarks as seeds, not graves, for ideas.', 'pinboard.in'],
  ['Weaving Contexts Together', 'How ideas gain meaning from their neighbours.', 'context.garden'],
  ['Lantern Notes', 'Writing small lights to guide your future self.', 'lanterns.notes'],
]

const slug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const MOCK_LINKS: Link[] = RAW.map(([title, description, domain]) => ({
  url: `https://${domain}/${slug(title)}`,
  title,
  description,
  domain,
}))

const CONNECTION_NOTES = [
  'builds on this idea',
  'a counterpoint worth holding',
  'cited as a companion read',
  'responds to this directly',
]

/**
 * Deterministic pseudo-relationships so every card has neighbours,
 * mirroring the prototype: pick by index offsets per relationship kind.
 */
export function mockRelatedFor(url: string): Related[] {
  const idx = Math.max(0, MOCK_LINKS.findIndex((l) => l.url === url))
  const pick = (offset: number, count: number, rel: Rel): Related[] => {
    const stride = rel === 'mutual' ? 1 : rel === 'similar' ? 2 : 3
    const out: Related[] = []
    for (let k = 1; k <= count; k++) {
      const l = MOCK_LINKS[(idx + offset + k * stride) % MOCK_LINKS.length]
      if (l.url !== url)
        out.push({
          ...l,
          rel,
          note: rel === 'connected' ? CONNECTION_NOTES[(idx + k) % CONNECTION_NOTES.length] : undefined,
        })
    }
    return out
  }
  return [...pick(1, 4, 'mutual'), ...pick(2, 4, 'similar'), ...pick(3, 4, 'connected')]
}
