"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { deleteBlobByUrl, isBlobUploadConfigured, uploadPublicImage } from "@/lib/blob-upload"
import { friendlyDatabaseError } from "@/lib/db-friendly-error"
import { getDb } from "@/lib/db"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import { projects, uploadedImages } from "@/lib/db/schema"

/** Per-file cap (raise only if you also raise Next body limits in `next.config.mjs`). */
const MAX_UPLOAD_BYTES_PER_FILE = 12 * 1024 * 1024

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/gif") return "gif"
  return "bin"
}

function truncateName(name: string, max = 200): string {
  const n = name.trim()
  if (n.length <= max) return n
  return `${n.slice(0, max - 1)}…`
}

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

export type TrailUploadRow = {
  id: string
  url: string
  originalName: string | null
  mimeType: string
  sizeBytes: number
  createdAt: Date
  projectId: string | null
  projectName: string | null
}

/** Images in a project folder (admin must own the project). */
export async function listProjectUploads(projectId: string): Promise<TrailUploadRow[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return []
  }
  if (!getPooledDatabaseUrl()) {
    return []
  }
  const userId = session.user.id
  try {
    const [proj] = await getDb()
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerUserId, userId)))
      .limit(1)
    if (!proj) return []

    const rows = await getDb()
      .select({
        id: uploadedImages.id,
        url: uploadedImages.url,
        originalName: uploadedImages.originalName,
        mimeType: uploadedImages.mimeType,
        sizeBytes: uploadedImages.sizeBytes,
        createdAt: uploadedImages.createdAt,
        projectId: uploadedImages.projectId,
      })
      .from(uploadedImages)
      .where(and(eq(uploadedImages.projectId, projectId), eq(uploadedImages.userId, userId)))
      .orderBy(desc(uploadedImages.createdAt))

    return rows.map((r) => ({
      ...r,
      projectName: proj.name,
    }))
  } catch {
    return []
  }
}

export type UploadTrailImagesResult =
  | { ok: true; uploaded: number }
  | { ok: false; error: string }

export async function uploadTrailImages(
  formData: FormData
): Promise<UploadTrailImagesResult> {
  try {
    const userId = await requireAdminDb()
    if (!isBlobUploadConfigured()) {
      return { ok: false, error: "Vercel Blob is not configured (BLOB_READ_WRITE_TOKEN)." }
    }

    const raw = formData.getAll("file")
    const files = raw.filter((f): f is File => f instanceof File && f.size > 0)
    if (files.length === 0) {
      return { ok: false, error: "No files selected." }
    }

    const projectIdRaw = formData.get("projectId")
    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim() !== ""
        ? projectIdRaw.trim()
        : null
    if (!projectId) {
      return { ok: false, error: "Uploads must go into a project folder." }
    }

    const [proj] = await getDb()
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerUserId, userId)))
      .limit(1)
    if (!proj) {
      return { ok: false, error: "Invalid project." }
    }

    let count = 0
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES_PER_FILE) {
        return {
          ok: false,
          error: `File too large (max ${MAX_UPLOAD_BYTES_PER_FILE / (1024 * 1024)}MB): ${file.name || "image"}`,
        }
      }
      const mimeType = file.type || "application/octet-stream"
      if (!ALLOWED_MIME.has(mimeType)) {
        return {
          ok: false,
          error: `Unsupported type for ${file.name || "image"}: ${mimeType}`,
        }
      }

      const body = await file.arrayBuffer()
      const ext = extForMime(mimeType)
      const pathname = `trail/${userId}/${crypto.randomUUID()}.${ext}`
      const { url, pathname: storedPath } = await uploadPublicImage(
        pathname,
        body,
        mimeType
      )

      await getDb().insert(uploadedImages).values({
        userId,
        projectId,
        url,
        pathname: storedPath,
        originalName: file.name ? truncateName(file.name) : null,
        mimeType,
        sizeBytes: file.size,
      })
      count += 1
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
    revalidatePath(`/admin/projects/${proj.slug}`)
    revalidatePath("/projects")
    revalidatePath(`/projects/${proj.slug}`)
    return { ok: true, uploaded: count }
  } catch (e) {
    return { ok: false, error: friendlyDatabaseError(e) }
  }
}

export async function deleteTrailImage(imageId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAdminDb()
    const [row] = await getDb()
      .select()
      .from(uploadedImages)
      .where(and(eq(uploadedImages.id, imageId), eq(uploadedImages.userId, userId)))
      .limit(1)

    if (!row) {
      return { ok: false, error: "Image not found." }
    }

    let projectSlug: string | null = null
    if (row.projectId) {
      const [p] = await getDb()
        .select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.id, row.projectId))
        .limit(1)
      projectSlug = p?.slug ?? null
    }

    try {
      await deleteBlobByUrl(row.url)
    } catch {
      /* Blob may already be removed; still drop DB row. */
    }
    await getDb().delete(uploadedImages).where(eq(uploadedImages.id, imageId))

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
    if (projectSlug) {
      revalidatePath(`/admin/projects/${projectSlug}`)
      revalidatePath(`/projects/${projectSlug}`)
    }
    revalidatePath("/projects")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendlyDatabaseError(e) }
  }
}
