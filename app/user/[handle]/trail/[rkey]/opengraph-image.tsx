import { ImageResponse } from 'next/og'

export const alt = 'A trail shared on Forager'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TINTS = ['#c8734b', '#d99a5b', '#8a9a6f', '#9a8ba8', '#5f8a86', '#a86f6f']

function tintFor(handle: string) {
  let h = 0
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) | 0
  return TINTS[Math.abs(h) % TINTS.length]
}

/**
 * Dynamic share card, following docs/open_graph/forager-og-trail-shared.template.svg.
 * Mock mode only knows the handle (collection data is client-side); the real
 * impl would fetch the collection server-side and fill the trail title +
 * "N stops" subtitle.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; rkey: string }>
}) {
  const { handle: rawHandle } = await params
  const handle = decodeURIComponent(rawHandle)
  const tint = tintFor(handle)
  const initial = (handle[0] ?? 'f').toUpperCase()

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
              {`@${handle}`}
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: '#e4d8c6', marginTop: 28 }} />

        {/* hero */}
        <div style={{ fontSize: 66, fontWeight: 700, color: '#3d352b', marginTop: 48 }}>
          A foraged trail
        </div>
        <div style={{ fontSize: 26, color: '#6f6455', marginTop: 10 }}>
          Walked link by link on Semble — open it to wander.
        </div>

        {/* trail spine with nodes + bear */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: 878,
              height: 16,
              borderRadius: 8,
              background: '#e4d8c6',
            }}
          >
            {[
              { left: 86, color: '#c8734b', r: 13 },
              { left: 226, color: '#cdbfa6', r: 10 },
              { left: 356, color: '#8a9a6f', r: 13 },
              { left: 496, color: '#cdbfa6', r: 10 },
              { left: 636, color: tint, r: 13 },
              { left: 766, color: '#cdbfa6', r: 10 },
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
          <svg width={160} height={160} viewBox="0 0 100 100" style={{ marginLeft: 30 }}>
            <circle cx={30} cy={34} r={12} fill="#c8734b" />
            <circle cx={70} cy={34} r={12} fill="#c8734b" />
            <circle cx={30} cy={34} r={5.5} fill="#b3603c" />
            <circle cx={70} cy={34} r={5.5} fill="#b3603c" />
            <circle cx={50} cy={54} r={30} fill="#c8734b" />
            <ellipse cx={50} cy={64} rx={14} ry={11} fill="#fbf6ee" />
            <ellipse cx={50} cy={60} rx={5} ry={3.8} fill="#3d352b" />
            <circle cx={38} cy={50} r={3} fill="#3d352b" />
            <circle cx={62} cy={50} r={3} fill="#3d352b" />
            <path d="M84 30 q3 -7 9 -8" stroke="#8a9a6f" strokeWidth={3} fill="none" strokeLinecap="round" />
            <circle cx={84} cy={31} r={5} fill="#d99a5b" />
          </svg>
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
