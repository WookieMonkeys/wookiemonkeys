import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Another page | Elissa Mentesana",
}

export default function AnotherPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden px-6 pb-10 md:pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Another page
        </h1>
      </header>
      <p className="max-w-prose text-pretty text-muted-foreground">
        Example nested route so the breadcrumb reads{" "}
        <span className="whitespace-nowrap font-mono text-xs text-foreground/80">
          home / about / another page
        </span>
        . Use{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          SEGMENT_LABELS
        </code>{" "}
        in{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          site-breadcrumbs.tsx
        </code>{" "}
        for custom titles per URL segment.
      </p>
      <p className="mt-6">
        <Link
          href="/about"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to About
        </Link>
      </p>
    </div>
  )
}
