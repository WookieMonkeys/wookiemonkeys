import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { getPublishedProjectCards } from "@/lib/public-projects"

export const metadata: Metadata = {
  title: "Projects | Elissa Mentesana",
}

export default async function ProjectsIndexPage() {
  const cards = await getPublishedProjectCards()

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Projects
        </h1>
        <p className="mt-2 max-w-prose text-pretty text-muted-foreground">
          Shared photo folders. More may appear here as they are published.
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="text-muted-foreground text-sm">No public projects yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.id}>
              <Link
                href={`/projects/${c.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-opacity hover:opacity-90"
              >
                <div className="relative aspect-[4/3] w-full bg-muted">
                  {c.coverUrl ? (
                    <Image
                      src={c.coverUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No photos yet
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
                    {c.name}
                  </h2>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
