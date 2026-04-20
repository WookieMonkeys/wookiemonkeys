"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { auth, signOut } from "@/auth"
import { getDb } from "@/lib/db"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import { userPreferences, type UserPreferencesData } from "@/lib/db/schema"

export async function signOutFromAdmin() {
  await signOut({ redirectTo: "/" })
}

export async function getMyPreferences(): Promise<UserPreferencesData> {
  const session = await auth()
  if (!session?.user?.id) return {}
  if (!getPooledDatabaseUrl()) return {}
  const [row] = await getDb()
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1)
  return row?.data ?? {}
}

export async function saveMyPreferences(partial: UserPreferencesData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  if (!getPooledDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is not set; configure Neon to persist preferences."
    )
  }

  const existing = await getMyPreferences()
  const merged: UserPreferencesData = { ...existing, ...partial }

  await getDb()
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      data: merged,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        data: merged,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/admin")
}
