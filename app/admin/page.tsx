import Link from "next/link"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { AdminPreferencesForm } from "@/app/admin/preferences-form"
import { SignOutButton } from "@/app/admin/sign-out-button"
import { getMyPreferences } from "@/app/admin/actions"

export default async function AdminPage() {
  const session = await auth()
  const preferences = await getMyPreferences()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-medium tracking-tight">
            Signed in
          </CardTitle>
          <CardDescription>
            {session?.user?.email ?? session?.user?.name ?? "Unknown user"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SignOutButton />
          <Link
            href="/admin/projects"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Manage projects
          </Link>
        </CardContent>
      </Card>

      <div className="min-w-0 w-full">
        <AdminPreferencesForm initialJson={JSON.stringify(preferences, null, 2)} />
      </div>
    </div>
  )
}
