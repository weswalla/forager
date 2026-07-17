'use client'

/**
 * Forager bear marks (see docs/forage-identity.html). Each mark is one set of
 * shapes recoloured through a palette — geometry stays identical so the
 * family reads as one identity.
 */

export type BearKind = 'peek' | 'head' | 'glyph' | 'forage'
export type BearPalette = 'terra' | 'reverse' | 'amber' | 'sage' | 'ink'

const PALETTES: Record<
  BearPalette,
  { fur: string; inner: string; muzzle: string; nose: string; trail: string; berry: string; leaf: string }
> = {
  terra: { fur: '#c8734b', inner: '#b3603c', muzzle: '#fbf6ee', nose: '#3d352b', trail: '#e4d8c6', berry: '#d99a5b', leaf: '#8a9a6f' },
  reverse: { fur: '#fbf6ee', inner: '#d99a5b', muzzle: '#f6eee2', nose: '#3d352b', trail: '#e0b892', berry: '#d99a5b', leaf: '#b7c39a' },
  amber: { fur: '#d99a5b', inner: '#c8734b', muzzle: '#fbf6ee', nose: '#3d352b', trail: '#e4d8c6', berry: '#c8734b', leaf: '#8a9a6f' },
  sage: { fur: '#8a9a6f', inner: '#6f7f56', muzzle: '#f4efe2', nose: '#3d352b', trail: '#e4d8c6', berry: '#c8734b', leaf: '#c8734b' },
  ink: { fur: '#3d352b', inner: '#6f6455', muzzle: '#f6eee2', nose: '#d99a5b', trail: '#c9bda8', berry: '#d99a5b', leaf: '#8a9a6f' },
}

export function Bear({
  kind = 'head',
  palette = 'terra',
  size = 32,
  className,
}: {
  kind?: BearKind
  palette?: BearPalette
  size?: number
  className?: string
}) {
  const p = PALETTES[palette]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      {kind === 'peek' && (
        <>
          <g style={{ clipPath: 'inset(0 0 28% 0)' }}>
            <circle cx={30} cy={34} r={12} fill={p.fur} />
            <circle cx={70} cy={34} r={12} fill={p.fur} />
            <circle cx={30} cy={34} r={5.5} fill={p.inner} />
            <circle cx={70} cy={34} r={5.5} fill={p.inner} />
            <ellipse cx={50} cy={58} rx={30} ry={28} fill={p.fur} />
            <ellipse cx={50} cy={66} rx={15} ry={11} fill={p.muzzle} />
            <ellipse cx={50} cy={62} rx={6} ry={4.4} fill={p.nose} />
            <circle cx={39} cy={54} r={3} fill={p.nose} />
            <circle cx={61} cy={54} r={3} fill={p.nose} />
          </g>
          <rect x={6} y={72} width={88} height={7} rx={3.5} fill={p.trail} />
          <ellipse cx={30} cy={72} rx={8} ry={6} fill={p.fur} />
          <ellipse cx={70} cy={72} rx={8} ry={6} fill={p.fur} />
          <path d="M84 30 q3 -7 9 -8" stroke={p.leaf} strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={84} cy={31} r={5} fill={p.berry} />
        </>
      )}
      {kind === 'head' && (
        <>
          <circle cx={27} cy={28} r={14} fill={p.fur} />
          <circle cx={73} cy={28} r={14} fill={p.fur} />
          <circle cx={27} cy={28} r={6.5} fill={p.inner} />
          <circle cx={73} cy={28} r={6.5} fill={p.inner} />
          <ellipse cx={50} cy={56} rx={34} ry={32} fill={p.fur} />
          <ellipse cx={50} cy={67} rx={18} ry={14} fill={p.muzzle} />
          <path
            d="M50 57c6 0 9 3.4 9 6.2 0 3.3-4 5.4-9 5.4s-9-2.1-9-5.4c0-2.8 3-6.2 9-6.2z"
            fill={p.nose}
          />
          <circle cx={37} cy={49} r={3.4} fill={p.nose} />
          <circle cx={63} cy={49} r={3.4} fill={p.nose} />
        </>
      )}
      {kind === 'forage' && (
        <>
          <circle cx={28} cy={26} r={12} fill={p.fur} />
          <circle cx={72} cy={24} r={12} fill={p.fur} />
          <circle cx={28} cy={26} r={5.5} fill={p.inner} />
          <circle cx={72} cy={24} r={5.5} fill={p.inner} />
          <ellipse cx={50} cy={49} rx={30} ry={29} fill={p.fur} />
          <ellipse cx={50} cy={62} rx={16} ry={13} fill={p.muzzle} />
          <ellipse cx={50} cy={68} rx={6} ry={4.6} fill={p.nose} />
          <circle cx={38} cy={47} r={2.8} fill={p.nose} />
          <circle cx={60} cy={45} r={2.8} fill={p.nose} />
          <path d="M50 80 q-1 -6 -7 -9" stroke={p.leaf} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <circle cx={43} cy={86} r={4.4} fill={p.berry} />
          <circle cx={54} cy={88} r={4.4} fill={p.berry} />
          <circle cx={49} cy={91} r={4.4} fill={p.berry} />
        </>
      )}
      {kind === 'glyph' && (
        <>
          <circle cx={30} cy={34} r={12} fill={p.fur} />
          <circle cx={70} cy={34} r={12} fill={p.fur} />
          <circle cx={50} cy={54} r={30} fill={p.fur} />
          <ellipse cx={50} cy={64} rx={14} ry={11} fill={p.muzzle} />
          <ellipse cx={50} cy={60} rx={5} ry={3.8} fill={p.nose} />
          <circle cx={38} cy={50} r={3} fill={p.nose} />
          <circle cx={62} cy={50} r={3} fill={p.nose} />
        </>
      )}
    </svg>
  )
}
