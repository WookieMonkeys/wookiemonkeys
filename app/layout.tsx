import { Geist_Mono, Instrument_Serif } from "next/font/google"
import type { Metadata } from "next"

import Link from "next/link"

import { auth } from "@/auth"
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

const navLinkClass =
  "font-heading text-base leading-none font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 sm:text-lg md:text-2xl"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const showAdmin = session?.user?.role === "admin"

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
            <header className="pointer-events-none fixed top-0 right-0 left-0 z-50 bg-transparent px-4 py-2 md:px-6 md:py-3">
              <div className="pointer-events-none flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2">
                <div className="pointer-events-auto flex min-w-0 flex-1 flex-row flex-wrap items-end gap-x-3 gap-y-1 md:gap-x-4">
                  <Link
                    href="/"
                    className="font-heading shrink-0 text-2xl leading-none font-medium tracking-tight text-foreground sm:text-3xl md:text-5xl"
                  >
                    Elissa Mentesana
                  </Link>
                  <SiteBreadcrumbs className="min-w-0" />
                </div>
                <div className="pointer-events-auto flex shrink-0 items-end gap-4 sm:gap-6">
                  <Link href="/projects" className={navLinkClass}>
                    Projects
                  </Link>
                  <Link href="/about" className={navLinkClass}>
                    About
                  </Link>
                  <Link href="/about/contact" className={navLinkClass}>
                    Contact
                  </Link>
                  {showAdmin ? (
                    <Link href="/admin" className={navLinkClass}>
                      Admin
                    </Link>
                  ) : null}
                </div>
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
