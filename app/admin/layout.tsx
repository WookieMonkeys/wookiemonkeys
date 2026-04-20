import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/admin")
  }
  if (session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-6 pb-6 pt-[var(--site-header-offset)] md:px-8 md:pb-8">
        {children}
      </div>
    </div>
  )
}
