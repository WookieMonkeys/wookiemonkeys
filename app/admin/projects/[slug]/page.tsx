import Link from "next/link"
import { notFound } from "next/navigation"

import { isBlobUploadConfigured } from "@/lib/blob-upload"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import { ProjectPhotosPanel } from "@/app/admin/project-photos-panel"
import { getAdminProjectBySlug } from "@/app/admin/projects-actions"
import { listProjectUploads } from "@/app/admin/uploads-actions"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function AdminProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getAdminProjectBySlug(slug)
  if (!project) {
    notFound()
  }

  const images = await listProjectUploads(project.id)
  const blobConfigured = isBlobUploadConfigured()
  const dbConfigured = Boolean(getPooledDatabaseUrl())

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <Link
          href="/admin/projects"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Projects
        </Link>
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {project.name}
        </h1>
        <span className="text-muted-foreground text-sm">/projects/{project.slug}</span>
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          View on site
        </Link>
      </div>

      <ProjectPhotosPanel
        projectId={project.id}
        projectSlug={project.slug}
        initialImages={images}
        blobConfigured={blobConfigured}
        dbConfigured={dbConfigured}
      />
    </div>
  )
}
