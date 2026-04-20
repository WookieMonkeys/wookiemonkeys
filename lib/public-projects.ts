import { and, desc, eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import { projects, uploadedImages } from "@/lib/db/schema"

export type PublishedProjectCard = {
  id: string
  name: string
  slug: string
  coverUrl: string | null
}

/** Projects the admin marked visible to everyone (`/projects`). */
export async function getPublishedProjectCards(): Promise<PublishedProjectCard[]> {
  if (!getPooledDatabaseUrl()) return []

  try {
    const visible = await getDb()
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
      })
      .from(projects)
      .where(eq(projects.visibleToClients, true))
      .orderBy(desc(projects.updatedAt))

    if (visible.length === 0) return []

    const imgs = await getDb()
      .select({
        projectId: uploadedImages.projectId,
        url: uploadedImages.url,
        createdAt: uploadedImages.createdAt,
      })
      .from(uploadedImages)
      .innerJoin(projects, eq(uploadedImages.projectId, projects.id))
      .where(eq(projects.visibleToClients, true))
      .orderBy(desc(uploadedImages.createdAt))

    const coverBy = new Map<string, string>()
    for (const row of imgs) {
      if (row.projectId && !coverBy.has(row.projectId)) {
        coverBy.set(row.projectId, row.url)
      }
    }

    return visible.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      coverUrl: coverBy.get(p.id) ?? null,
    }))
  } catch {
    return []
  }
}

export type PublishedProjectDetail = {
  id: string
  name: string
  slug: string
  images: { id: string; url: string; originalName: string | null }[]
}

export async function getPublishedProjectBySlug(
  slug: string
): Promise<PublishedProjectDetail | null> {
  if (!getPooledDatabaseUrl() || !slug) return null

  try {
    const [proj] = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.visibleToClients, true)))
      .limit(1)

    if (!proj) return null

    const imgs = await getDb()
      .select({
        id: uploadedImages.id,
        url: uploadedImages.url,
        originalName: uploadedImages.originalName,
      })
      .from(uploadedImages)
      .where(eq(uploadedImages.projectId, proj.id))
      .orderBy(desc(uploadedImages.createdAt))

    return {
      id: proj.id,
      name: proj.name,
      slug: proj.slug,
      images: imgs,
    }
  } catch {
    return null
  }
}
