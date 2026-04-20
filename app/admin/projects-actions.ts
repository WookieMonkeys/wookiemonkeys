"use server"

import { revalidatePath } from "next/cache"
import { and, count, desc, eq, isNotNull } from "drizzle-orm"

import { auth } from "@/auth"
import { deleteBlobByUrl } from "@/lib/blob-upload"
import { getDb } from "@/lib/db"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import { friendlyDatabaseError } from "@/lib/db-friendly-error"
import { projects, uploadedImages } from "@/lib/db/schema"
import { slugifyProjectName } from "@/lib/slug"

async function requireAdminDb() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }
  if (!getPooledDatabaseUrl()) {
    throw new Error("Database is not configured.")
  }
  return session.user.id
}

export type AdminProjectRow = {
  id: string
  name: string
  slug: string
  visibleToClients: boolean
  imageCount: number
  createdAt: Date
}

export async function getAdminProjectBySlug(
  slug: string
): Promise<AdminProjectRow | null> {
  let userId: string
  try {
    userId = await requireAdminDb()
  } catch {
    return null
  }

  try {
    const [row] = await getDb()
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        visibleToClients: projects.visibleToClients,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.ownerUserId, userId)))
      .limit(1)

    if (!row) return null

    const [c] = await getDb()
      .select({ n: count() })
      .from(uploadedImages)
      .where(eq(uploadedImages.projectId, row.id))

    return {
      ...row,
      imageCount: Number(c?.n ?? 0),
    }
  } catch {
    return null
  }
}

export async function listAdminProjects(): Promise<AdminProjectRow[]> {
  let userId: string
  try {
    userId = await requireAdminDb()
  } catch {
    return []
  }

  try {
    const rows = await getDb()
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        visibleToClients: projects.visibleToClients,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.ownerUserId, userId))
      .orderBy(desc(projects.updatedAt))

    const counts = await getDb()
      .select({
        projectId: uploadedImages.projectId,
        n: count(),
      })
      .from(uploadedImages)
      .where(isNotNull(uploadedImages.projectId))
      .groupBy(uploadedImages.projectId)

    const countBy = new Map<string, number>()
    for (const c of counts) {
      if (c.projectId != null) countBy.set(c.projectId, Number(c.n))
    }

    return rows.map((r) => ({
      ...r,
      imageCount: countBy.get(r.id) ?? 0,
    }))
  } catch {
    return []
  }
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = slugifyProjectName(base)
  const db = getDb()
  for (let i = 0; i < 20; i++) {
    const [hit] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, candidate))
      .limit(1)
    if (!hit) return candidate
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8)
    candidate = `${slugifyProjectName(base)}-${suffix}`
  }
  return `${slugifyProjectName(base)}-${crypto.randomUUID()}`
}

export type CreateProjectResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string }

export async function createProject(name: string): Promise<CreateProjectResult> {
  try {
    const userId = await requireAdminDb()
    const trimmed = name.trim()
    if (!trimmed) {
      return { ok: false, error: "Project name is required." }
    }

    const slug = await uniqueSlug(trimmed)
    const now = new Date()
    const [row] = await getDb()
      .insert(projects)
      .values({
        ownerUserId: userId,
        name: trimmed,
        slug,
        visibleToClients: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: projects.id, slug: projects.slug })

    if (!row) return { ok: false, error: "Could not create project." }

    revalidatePath("/admin")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/${row.slug}`)
    revalidatePath("/projects")
    return { ok: true, id: row.id, slug: row.slug }
  } catch (e) {
    return { ok: false, error: friendlyDatabaseError(e) }
  }
}

export async function setProjectVisibleToClients(
  projectId: string,
  visible: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAdminDb()
    const res = await getDb()
      .update(projects)
      .set({ visibleToClients: visible, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.ownerUserId, userId)))
      .returning({ id: projects.id, slug: projects.slug })

    if (res.length === 0) return { ok: false, error: "Project not found." }

    const slug = res[0]!.slug
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/${slug}`)
    revalidatePath("/projects")
    revalidatePath(`/projects/${slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendlyDatabaseError(e) }
  }
}

export async function deleteProject(projectId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAdminDb()
    const db = getDb()

    const [proj] = await db
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerUserId, userId)))
      .limit(1)
    if (!proj) return { ok: false, error: "Project not found." }

    const imgs = await db.select().from(uploadedImages).where(eq(uploadedImages.projectId, projectId))
    for (const img of imgs) {
      try {
        await deleteBlobByUrl(img.url)
      } catch {
        /* blob may be gone */
      }
    }

    await db.delete(uploadedImages).where(eq(uploadedImages.projectId, projectId))
    await db.delete(projects).where(eq(projects.id, projectId))

    revalidatePath("/admin")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/${proj.slug}`)
    revalidatePath("/projects")
    revalidatePath(`/projects/${proj.slug}`)
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendlyDatabaseError(e) }
  }
}
