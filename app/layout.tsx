import { Geist_Mono, Instrument_Serif } from "next/font/google"
import type { Metadata } from "next"

import Link from "next/link"

import "./globals.css"
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Elissa Mentesana",
  description: "Elissa Mentesana",
}

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-svh overflow-hidden antialiased",
        fontMono.variable,
        "font-sans",
        instrumentSerif.variable
      )}
    >
      <body className="h-svh overflow-hidden">
        <ThemeProvider>
          <div className="relative flex h-svh max-h-svh min-h-0 flex-col overflow-hidden">
            <div
              aria-hidden
              className="site-bg-photo pointer-events-none fixed inset-0 z-0"
            />
            <header className="pointer-events-none fixed top-0 right-0 left-0 z-50 bg-transparent px-6 py-3">
              <div className="pointer-events-none flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href="/"
                    className="font-heading shrink-0 text-4xl font-medium tracking-tight text-foreground md:text-5xl"
                  >
                    Elissa Mentesana
                  </Link>
                  <SiteBreadcrumbs className="min-w-0" />
                </div>
                <Link
                  href="/about"
                  className="pointer-events-auto shrink-0 font-heading text-xl font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-2xl"
                >
                  About
                </Link>
              </div>
            </header>
            <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
