import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublishedProjectBySlug } from "@/lib/public-projects"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPublishedProjectBySlug(slug)
  if (!data) return { title: "Project" }
  return {
    title: `${data.name} | Projects`,
  }
}

export default async function ProjectGalleryPage({ params }: Props) {
  const { slug } = await params
  const data = await getPublishedProjectBySlug(slug)
  if (!data) notFound()

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {data.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/projects" className="underline underline-offset-4 hover:text-foreground">
            All projects
          </Link>
        </p>
      </header>

      {data.images.length === 0 ? (
        <p className="text-muted-foreground text-sm">This project has no photos yet.</p>
      ) : (
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {data.images.map((img) => (
            <li key={img.id} className="break-inside-avoid">
              <figure className="overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- variable aspect from Blob URLs */}
                <img
                  src={img.url}
                  alt={img.originalName ?? ""}
                  className="h-auto w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
