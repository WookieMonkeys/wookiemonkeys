#!/usr/bin/env node
/**
 * Load the same env files you use locally, then report (without printing secrets)
 * whether auth + DB wiring looks sane and whether Neon answers `SELECT 1`.
 *
 *   npm run debug:connections
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config as loadEnv } from "dotenv"

import { mergeDevelopmentLocalEnvIntoProcess } from "../lib/merge-development-local.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))

for (const name of [
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
]) {
  const path = resolve(root, name)
  if (existsSync(path)) {
    loadEnv({ path, override: true })
    console.log(`loaded ${name}`)
  }
}

mergeDevelopmentLocalEnvIntoProcess(root)

function fileLooksDotenvx(path) {
  if (!existsSync(path)) return false
  const raw = readFileSync(path, "utf8")
  return (
    raw.includes("DOTENV_PUBLIC_KEY") ||
    raw.includes("/encrypted/") ||
    /^#\/\d+\/\w+\//m.test(raw)
  )
}

const dotenvxHintFiles = [".env.local", ".env.development.local", ".env"]
  .map((n) => resolve(root, n))
  .filter((p) => existsSync(p) && fileLooksDotenvx(p))

function present(key) {
  const v = process.env[key]
  return v !== undefined && String(v).trim() !== ""
}

function mask(key) {
  const v = process.env[key]
  if (!present(key)) return "(unset)"
  const s = String(v)
  if (s.length <= 10) return `[${s.length} chars]`
  return `${s.slice(0, 4)}…${s.slice(-4)} (${s.length} chars)`
}

function pooledUrl() {
  return (
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || ""
  )
}

console.log("\n--- Env files (see messages above) ---\n")

console.log("--- Auth.js (session / OAuth) ---")
console.log(
  `  AUTH_SECRET          ${present("AUTH_SECRET") || present("NEXTAUTH_SECRET") ? "ok " + mask(present("AUTH_SECRET") ? "AUTH_SECRET" : "NEXTAUTH_SECRET") : "MISSING (set AUTH_SECRET or NEXTAUTH_SECRET)"}`
)
console.log(`  AUTH_URL             ${present("AUTH_URL") || present("NEXTAUTH_URL") ? "ok " + mask(present("AUTH_URL") ? "AUTH_URL" : "NEXTAUTH_URL") : "(optional but recommended)"}`)
console.log(
  `  AUTH_TRUST_HOST      ${process.env.AUTH_TRUST_HOST === "false" ? "false (strict)" : "trusted (default unless false)"}`
)
console.log(
  `  AUTH_GITHUB_ID       ${present("AUTH_GITHUB_ID") ? "ok " + mask("AUTH_GITHUB_ID") : "MISSING"}`
)
console.log(
  `  AUTH_GITHUB_SECRET   ${present("AUTH_GITHUB_SECRET") ? "ok " + mask("AUTH_GITHUB_SECRET") : "MISSING"}`
)
console.log(
  `  AUTH_GOOGLE_ID       ${present("AUTH_GOOGLE_ID") ? "ok " + mask("AUTH_GOOGLE_ID") : "MISSING"}`
)
console.log(
  `  AUTH_GOOGLE_SECRET   ${present("AUTH_GOOGLE_SECRET") ? "ok " + mask("AUTH_GOOGLE_SECRET") : "MISSING"}`
)
console.log(
  `  ADMIN_ALLOWED_EMAILS ${present("ADMIN_ALLOWED_EMAILS") ? "ok (" + process.env.ADMIN_ALLOWED_EMAILS.split(",").length + " entries)" : "MISSING (no one can sign in)"}`
)

if (
  !present("AUTH_SECRET") &&
  !present("NEXTAUTH_SECRET") &&
  dotenvxHintFiles.length > 0
) {
  console.log("\n  WARNING: dotenvx-style encrypted env detected in:")
  for (const p of dotenvxHintFiles) {
    console.log("     ", p.replace(root + "/", ""))
  }
  console.log(
    "     Plain `dotenv` (and Next.js) do not decrypt those files. Use decrypted values in .env.local,"
  )
  console.log(
    "     or run the app via dotenvx, e.g. `dotenvx run -- npm run dev` / `dotenvx run -- npm start`."
  )
}

console.log("\n--- Database (Neon + Drizzle runtime) ---")
const dbUrl = pooledUrl()
console.log(`  DATABASE_URL         ${present("DATABASE_URL") ? "set " + mask("DATABASE_URL") : "absent"}`)
console.log(`  POSTGRES_URL         ${present("POSTGRES_URL") ? "set " + mask("POSTGRES_URL") : "absent"}`)
const pooledEnvKey = present("DATABASE_URL")
  ? "DATABASE_URL"
  : present("POSTGRES_URL")
    ? "POSTGRES_URL"
    : null
console.log(
  `  pooled URL for app   ${dbUrl && pooledEnvKey ? "ok (from " + pooledEnvKey + ") " + mask(pooledEnvKey) : "MISSING → Auth uses JWT-only; getDb() throws"}`
)

if (dbUrl) {
  try {
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(dbUrl)
    const rows = await sql`select 1 as ok`
    console.log("\n  Neon ping: OK", rows)
  } catch (err) {
    const msg = String(err?.message ?? err)
    console.error("\n  Neon ping: FAILED", msg)
    if (msg.includes("fetch failed")) {
      console.error(
        "     (Often offline, firewall, or wrong URL. Retry on a network that can reach Neon.)"
      )
    }
  }
} else {
  console.log("\n  Neon ping: skipped (no pooled URL)")
}

console.log("\n--- Notes ---")
console.log(
  "  • `next start` loads .env / .env.local / .env.production*; next.config merges .env.development.local into empty keys."
)
console.log(
  "  • `next dev` loads .env.development.local automatically; merge still helps if keys are only there."
)
console.log("  • Run `vercel env pull .env.development.local` if vars live on Vercel only.")
console.log("  • Run `npm run debug:connections` any time to re-check (needs network for Neon ping).\n")
