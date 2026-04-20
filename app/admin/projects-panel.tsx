"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

import {
  createProject,
  deleteProject,
  setProjectVisibleToClients,
  type AdminProjectRow,
} from "./projects-actions"

type AdminProjectsPanelProps = {
  initialProjects: AdminProjectRow[]
}

export function AdminProjectsPanel({ initialProjects }: AdminProjectsPanelProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [togglePending, setTogglePending] = useState<string | null>(null)
  const [deletePending, setDeletePending] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const trimmed = name.trim()
    startTransition(async () => {
      const result = await createProject(trimmed)
      if (result.ok) {
        setName("")
        setMessage(`Created “${trimmed}” (/projects/${result.slug}).`)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  async function handleToggle(projectId: string, next: boolean) {
    setError(null)
    setMessage(null)
    setTogglePending(projectId)
    const result = await setProjectVisibleToClients(projectId, next)
    setTogglePending(null)
    if (result.ok) {
      setMessage(next ? "Project is now visible on /projects." : "Project hidden from /projects.")
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Delete this project and all photos inside it? This cannot be undone.")) {
      return
    }
    setError(null)
    setMessage(null)
    setDeletePending(projectId)
    const result = await deleteProject(projectId)
    setDeletePending(null)
    if (result.ok) {
      setMessage("Project deleted.")
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-medium tracking-tight">
          Projects
        </CardTitle>
        <CardDescription>
          Open a project to upload and review photos. Turn on{" "}
          <strong>Visible to visitors</strong> so it also appears on the public{" "}
          <Link href="/projects" className="text-foreground underline underline-offset-4">
            /projects
          </Link>{" "}
          page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm text-muted-foreground">
            New project name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2025 shoot"
              disabled={pending}
              className="mt-2 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground ring-1 ring-foreground/10 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
            />
          </label>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "Creating…" : "Create project"}
          </Button>
        </form>

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

        <div className="border-t border-border/60 pt-4">
          <h3 className="mb-3 font-heading text-lg font-medium tracking-tight">Your projects</h3>
          {initialProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No projects yet. Create one, then open it to add photos.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {initialProjects.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 border-b border-border/40 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-muted-foreground text-xs">
                      /projects/{p.slug} · {p.imageCount} photo{p.imageCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
                      <span>Visible to visitors</span>
                      <Switch
                        size="sm"
                        checked={p.visibleToClients}
                        disabled={togglePending === p.id}
                        onCheckedChange={(checked) => handleToggle(p.id, checked)}
                        className="border-transparent data-checked:border-[#728557] data-checked:bg-[#8A9B68]"
                      />
                    </label>
                    <Link
                      href={`/admin/projects/${p.slug}`}
                      className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                    >
                      Photos
                    </Link>
                    <Link
                      href={`/projects/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      View site
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletePending === p.id}
                      onClick={() => handleDelete(p.id)}
                    >
                      {deletePending === p.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
