import type { Metadata, Viewport } from 'next'
import '../styles/tokens.css'
import './globals.css'

const OG_TITLE = 'Forager — a calm client for Semble'
const OG_DESCRIPTION =
  'A calm client for the Semble network. Forage the links worth keeping, add notes, and follow the trails between them — no feed, just paths.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forager.link'),
  title: 'Forager · trail browser',
  description: OG_DESCRIPTION,
  appleWebApp: {
    capable: true,
    title: 'Forager',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Forager',
    url: '/',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [
      {
        url: '/og/forager-og-roundel.png',
        width: 1200,
        height: 630,
        alt: 'The Forager bear peeking over a trail',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ['/og/forager-og-roundel.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4ece1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
