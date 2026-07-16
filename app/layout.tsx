import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import Cursor from '@/components/Cursor'
import Intro from '@/components/Intro'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '300', '400'],
  variable: '--font-inter',
})

const sandoval = localFont({
  src: '../public/fonts/Sandoval.otf',
  variable: '--font-bubble',
})

export const metadata: Metadata = {
  title: 'Wookie Monkeys',
  description: 'Record Label',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sandoval.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light')})()`}
        </Script>
        <ThemeProvider>
          <Cursor />
          <Intro />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
