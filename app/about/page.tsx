import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About | Elissa Mentesana",
}

export default function AboutPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden px-6 pb-10 md:pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          About
        </h1>
      </header>
      <p className="max-w-prose text-pretty text-muted-foreground">
        This is a second page on the site. Replace this copy with whatever you
        want to show here.
      </p>
      <p className="mt-6">
        <Link
          href="/about/contact"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Contact →
        </Link>
      </p>
    </div>
  )
}
