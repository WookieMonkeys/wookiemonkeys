/**
 * Resolve Neon / Vercel Storage env vars (see Vercel Neon integration).
 * Runtime: prefer pooled `DATABASE_URL` or `POSTGRES_URL`.
 * Migrations: prefer unpooled when set (Drizzle Kit / DDL).
 */
export function getPooledDatabaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()
  return url || undefined
}

export function getMigrationDatabaseUrl(): string | undefined {
  const unpooled =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim()
  return unpooled || getPooledDatabaseUrl()
}
