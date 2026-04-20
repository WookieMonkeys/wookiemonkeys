import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Merge `.env.development.local` into `process.env` (fill missing or empty keys only).
 * Used by `next.config.mjs` and `scripts/debug-connections.mjs`.
 *
 * @param {string} [cwd=process.cwd()]
 */
export function mergeDevelopmentLocalEnvIntoProcess(cwd = process.cwd()) {
  const file = resolve(cwd, ".env.development.local")
  if (!existsSync(file)) return

  let content = readFileSync(file, "utf8")
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1)
  }

  for (const line of content.split(/\r?\n/)) {
    let trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    if (trimmed.startsWith("export ")) {
      trimmed = trimmed.slice(7).trim()
    }
    const eq = trimmed.indexOf("=")
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!key) continue
    const existing = process.env[key]
    if (existing !== undefined && existing !== "") continue
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}
