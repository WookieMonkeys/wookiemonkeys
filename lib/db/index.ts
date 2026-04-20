import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"

import { getPooledDatabaseUrl } from "./env"
import * as schema from "./schema"

export type DbClient = NeonHttpDatabase<typeof schema>

let cache: DbClient | undefined

function requireDatabaseUrl(): string {
  const url = getPooledDatabaseUrl()
  if (!url) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is not set. Pull env from Vercel (see .env.example)."
    )
  }
  return url
}

export function getDb(): DbClient {
  if (!cache) {
    cache = drizzle(neon(requireDatabaseUrl()), { schema })
  }
  return cache
}
