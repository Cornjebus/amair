import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Amari - Every bedtime becomes a butterfly of imagination',
  description: 'Magical bedtime storyteller for families. Create personalized, whimsical stories that bring joy to bedtime.',
  keywords: ['bedtime stories', 'children', 'AI storytelling', 'family', 'imagination'],
  authors: [{ name: 'Amari Team' }],
  openGraph: {
    title: 'Amari - Magical Bedtime Stories',
    description: 'Every bedtime becomes a butterfly of imagination',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} ${playfair.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
