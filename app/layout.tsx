import type { Metadata, Viewport } from 'next'
import '../styles/tokens.css'
import './globals.css'

const OG_TITLE = 'Forager — A Semble client for meandering'
const OG_DESCRIPTION =
  'Forage interesting links, share what you collect, seed someone’s next trail. Replace scrolling with trail building.'
const OG_IMAGE = '/og/forager-og-meander-paws.png'
const OG_IMAGE_ALT = 'Forager — replace scrolling with trail building'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forager.link'),
  title: OG_TITLE,
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
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
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
