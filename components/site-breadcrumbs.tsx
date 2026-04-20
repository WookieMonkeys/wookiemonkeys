"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import { cn } from "@/lib/utils"

/** Optional pretty labels for URL segments (slug → words). */
const SEGMENT_LABELS: Record<string, string> = {
  about: "About",
  admin: "Admin",
  contact: "Contact",
  projects: "Projects",
}

function labelForSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ")
}

export function SiteBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() || "/"
  const segments = pathname.split("/").filter(Boolean)

  const items: { href: string; label: string }[] = segments.map((seg, i) => ({
    href: `/${segments.slice(0, i + 1).join("/")}`,
    label: labelForSegment(seg),
  }))

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-xs leading-none lowercase tracking-tight text-muted-foreground sm:text-sm",
        "-translate-y-0.5",
        "border-l border-border/50 py-0.5 pl-3 sm:pl-3.5",
        className
      )}
    >
      <ol className="flex flex-wrap items-end gap-2">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <Fragment key={item.href}>
              {i > 0 ? (
                <li
                  aria-hidden
                  className="pointer-events-none select-none opacity-50"
                >
                  /
                </li>
              ) : null}
              <li className="min-w-0">
                {isLast ? (
                  <span aria-current="page" className="text-foreground">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
