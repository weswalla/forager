import { ImageResponse } from 'next/og'
import { fetchTrailCollection } from '@/lib/serverApi'

export const alt = 'A trail shared on Forager'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TINTS = ['#c8734b', '#d99a5b', '#8a9a6f', '#9a8ba8', '#5f8a86', '#a86f6f']

function tintFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return TINTS[Math.abs(h) % TINTS.length]
}

/**
 * Dynamic share card, following docs/open_graph4 CTA variant A
 * (forager-og-trail-shared-cta1.png): attribution → trail title → a trail
 * spine that leads the eye into a "Wander from this trail" button.
 *
 * The collection is fetched server-side (lib/serverApi) so the card shows the
 * real trail title, author name, and stop count. When that fetch returns null
 * (mock mode, private, or failure) we fall back to generic copy keyed off the
 * handle in the URL.
 *
 * The button is a flex row so it sizes to its label — the reference PNG had
 * the text overflowing a fixed-width pill and colliding with the arrow.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; rkey: string }>
}) {
  const { handle: rawHandle, rkey } = await params
  const handle = decodeURIComponent(rawHandle)
  const collection = await fetchTrailCollection(handle, rkey)

  const author = collection?.author || `@${handle}`
  const tint = tintFor(collection?.handle || handle)
  const initial = (author.replace(/^@/, '')[0] ?? 'f').toUpperCase()
  const stops = collection?.links.length ?? 0

  const title = collection?.title || 'A foraged trail'
  const subtitle = stops
    ? `${stops} stop${stops === 1 ? '' : 's'}, walked link by link on Semble.`
    : 'Walked link by link on Semble — open it to wander.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f4ece1',
          padding: '48px 64px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* attribution */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              background: tint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbf6ee',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 14, letterSpacing: 3, color: '#c8734b' }}>
              SHARED A TRAIL ON FORAGER
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#3d352b', marginTop: 4 }}>
              {author}
            </div>
            {collection?.author && (
              <div style={{ fontSize: 21, color: '#a99d8b', marginTop: 2 }}>{`@${handle}`}</div>
            )}
          </div>
        </div>
        <div style={{ height: 2, background: '#e4d8c6', marginTop: 28 }} />

        {/* hero: trail title */}
        <div
          style={{
            fontSize: title.length > 34 ? 52 : 66,
            fontWeight: 700,
            color: '#3d352b',
            marginTop: 44,
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 26, color: '#6f6455', marginTop: 12 }}>{subtitle}</div>

        {/* trail spine leading into the CTA button */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              flex: 1,
              height: 16,
              borderRadius: 8,
              background: '#e4d8c6',
            }}
          >
            {[
              { left: 90, color: '#c8734b', r: 13 },
              { left: 300, color: '#8a9a6f', r: 11 },
              { left: 500, color: tint, r: 11 },
            ].map((n, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: n.left,
                  top: 8 - n.r,
                  width: n.r * 2,
                  height: n.r * 2,
                  borderRadius: n.r,
                  background: n.color,
                }}
              />
            ))}
          </div>

          {/* CTA — flex row sizes to the label; arrow sits after the text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginLeft: -24,
              padding: '18px 34px',
              borderRadius: 34,
              background: '#c8734b',
              boxShadow: '0 6px 0 rgba(143, 76, 46, 0.28)',
            }}
          >
            <div style={{ fontSize: 27, fontWeight: 700, color: '#fff7ef', whiteSpace: 'nowrap' }}>
              Wander from this trail
            </div>
            <svg width={30} height={20} viewBox="0 0 30 20">
              <line x1={2} y1={10} x2={26} y2={10} stroke="#fff7ef" strokeWidth={3.2} strokeLinecap="round" />
              <path
                d="M 19 3 L 27 10 L 19 17"
                fill="none"
                stroke="#fff7ef"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* footer brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 34 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#c8734b' }}>Forager</div>
          <div style={{ fontSize: 21, color: '#a99d8b' }}>· a Semble client · forager.link</div>
        </div>
      </div>
    ),
    size
  )
}
