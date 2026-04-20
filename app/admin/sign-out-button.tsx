"use client"

import { Button } from "@/components/ui/button"

import { signOutFromAdmin } from "./actions"

export function SignOutButton() {
  return (
    <form action={signOutFromAdmin}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  )
}
