import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Jhaz-Imprints | Premium Nigerian Traditional Attire',
  description:
    'Custom-tailored Nigerian traditional outfits delivered to your door. Browse Agbada, Ankara, Aso-Oke, Kaftan, and more. Wear your culture, your way.',
  keywords: [
    'Nigerian fashion',
    'traditional attire',
    'agbada',
    'ankara',
    'aso-oke',
    'kaftan',
    'custom tailoring',
    'African fashion',
  ],
}

export const viewport = {
  themeColor: '#B8860B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${plusJakarta.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
