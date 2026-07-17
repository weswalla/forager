// Rasterize the Forager bear roundel into PWA icons (public/icons/).
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const BEAR = `
  <circle cx="30" cy="34" r="12" fill="#fbf6ee"/>
  <circle cx="70" cy="34" r="12" fill="#fbf6ee"/>
  <circle cx="50" cy="54" r="30" fill="#fbf6ee"/>
  <ellipse cx="50" cy="64" rx="14" ry="11" fill="#f6dcc9"/>
  <ellipse cx="50" cy="60" rx="5" ry="3.8" fill="#3d352b"/>
  <circle cx="38" cy="50" r="3" fill="#3d352b"/>
  <circle cx="62" cy="50" r="3" fill="#3d352b"/>`

// standard icon: rounded terracotta tile, bear at 80%
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="#c8734b"/>
  <g transform="translate(10,10) scale(0.8)">${BEAR}</g>
</svg>`

// maskable: full-bleed square, bear inside the ~80% safe zone
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#c8734b"/>
  <g transform="translate(19,19) scale(0.62)">${BEAR}</g>
</svg>`

const out = new URL('../public/icons/', import.meta.url).pathname
await mkdir(out, { recursive: true })

const jobs = [
  { svg: icon, size: 192, file: 'icon-192.png' },
  { svg: icon, size: 512, file: 'icon-512.png' },
  { svg: icon, size: 180, file: 'apple-touch-icon.png' },
  { svg: maskable, size: 512, file: 'icon-maskable-512.png' },
]

for (const { svg, size, file } of jobs) {
  await sharp(Buffer.from(svg), { density: (72 * size) / 100 })
    .resize(size, size)
    .png()
    .toFile(out + file)
  console.log('wrote', file)
}
