import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { defineConfig } from "drizzle-kit"

import { getMigrationDatabaseUrl } from "./lib/db/env"

/** Same files Next.js loads locally; `dotenv/config` alone only reads `.env`. */
const envFiles = [
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
] as const

const root = process.cwd()
for (const name of envFiles) {
  const path = resolve(root, name)
  if (existsSync(path)) {
    loadEnv({ path, override: true })
  }
}

const migrationUrl = getMigrationDatabaseUrl()

const needsLiveDb = process.argv.some((arg) =>
  ["push", "migrate", "introspect", "studio", "check", "drop"].includes(arg)
)

if (needsLiveDb && !migrationUrl) {
  throw new Error(
    "Database URL is missing. Put DATABASE_URL (or POSTGRES_URL) in .env / .env.local, or run: vercel env pull .env.development.local (then retry db:push)."
  )
}

/** `generate` does not connect; Drizzle Kit still requires a non-empty URL string. */
const dbUrl =
  migrationUrl ?? "postgresql://user:pass@127.0.0.1:5432/postgres"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
})
