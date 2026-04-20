import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign-in error",
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const isAccessDenied = error === "AccessDenied"

  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          {isAccessDenied ? "Access denied" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          {isAccessDenied
            ? "You do not have permission to sign in."
            : "There was a problem signing in. You can try again or return to the site."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to site
          </Link>
          {!isAccessDenied ? (
            <Link href="/api/auth/signin" className={cn(buttonVariants())}>
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
