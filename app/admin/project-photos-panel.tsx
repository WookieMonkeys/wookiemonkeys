"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { deleteTrailImage, uploadTrailImages, type TrailUploadRow } from "./uploads-actions"

type ProjectPhotosPanelProps = {
  projectId: string
  projectSlug: string
  initialImages: TrailUploadRow[]
  blobConfigured: boolean
  dbConfigured: boolean
}

export function ProjectPhotosPanel({
  projectId,
  projectSlug,
  initialImages,
  blobConfigured,
  dbConfigured,
}: ProjectPhotosPanelProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canUpload = dbConfigured && blobConfigured

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    startTransition(async () => {
      const result = await uploadTrailImages(fd)
      if (result.ok) {
        setMessage(`Uploaded ${result.uploaded} image(s).`)
        form.reset()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  async function handleDelete(id: string) {
    setError(null)
    setMessage(null)
    setDeletingId(id)
    const result = await deleteTrailImage(id)
    setDeletingId(null)
    if (result.ok) {
      setMessage("Image removed.")
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-medium tracking-tight">
          Photos
        </CardTitle>
        <CardDescription>
          JPEG, PNG, WebP, GIF — max 12MB each. Stored on Vercel Blob; shown on{" "}
          <Link
            href={`/projects/${projectSlug}`}
            className="text-foreground underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            /projects/{projectSlug}
          </Link>{" "}
          when the project is visible to visitors.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!dbConfigured ? (
          <p className="text-destructive text-sm" role="alert">
            Database is not configured — uploads are disabled.
          </p>
        ) : null}
        {!blobConfigured ? (
          <p className="text-destructive text-sm" role="alert">
            Set <code className="text-foreground/80">BLOB_READ_WRITE_TOKEN</code> (Vercel
            Blob store) to enable uploads.
          </p>
        ) : null}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-t border-border/60 pt-4"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <label className="text-sm text-muted-foreground">
            Add images
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={!canUpload || pending}
              className="mt-2 block w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
            />
          </label>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-foreground/70 text-sm" role="status">
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={!canUpload || pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>

        <div className="border-t border-border/60 pt-4">
          <h3 className="mb-3 font-heading text-lg font-medium tracking-tight">
            In this project ({initialImages.length})
          </h3>
          <ProjectImageList
            images={initialImages}
            onDelete={handleDelete}
            deletingId={deletingId}
            disabled={!dbConfigured}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectImageList({
  images,
  onDelete,
  deletingId,
  disabled,
}: {
  images: TrailUploadRow[]
  onDelete: (id: string) => void
  deletingId: string | null
  disabled: boolean
}) {
  if (images.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No photos in this project yet. Upload above.</p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((u) => (
        <li
          key={u.id}
          className="flex gap-3 rounded-lg border border-border/60 bg-background/50 p-3"
        >
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={u.url}
              alt={u.originalName ?? "Project image"}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {u.originalName ?? u.url.slice(-24)}
              </p>
              <p className="text-muted-foreground text-xs">
                {(u.sizeBytes / 1024).toFixed(1)} KB · {u.mimeType}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={disabled || deletingId === u.id}
              onClick={() => onDelete(u.id)}
            >
              {deletingId === u.id ? "Removing…" : "Remove"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
