import type { Metadata } from "next"
import Link from "next/link"

import { AdminProjectsPanel } from "@/app/admin/projects-panel"
import { listAdminProjects } from "@/app/admin/projects-actions"

export const metadata: Metadata = {
  title: "Projects · Admin",
}

export default async function AdminProjectsIndexPage() {
  const adminProjects = await listAdminProjects()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Admin
        </Link>
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          Projects
        </h1>
      </div>

      <AdminProjectsPanel initialProjects={adminProjects} />
    </div>
  )
}
