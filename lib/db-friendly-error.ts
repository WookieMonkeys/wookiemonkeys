/** Turn Neon/Drizzle failures into short UI copy when migrations are missing. */
export function friendlyDatabaseError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (
    /does not exist/i.test(msg) ||
    /42P01/i.test(msg) ||
    (/Failed query/i.test(msg) && /"project"/i.test(msg)) ||
    (/Failed query/i.test(msg) && /uploaded_image/i.test(msg) && /project_id/i.test(msg))
  ) {
    return "Database is missing the latest tables. In your project directory run: npm run db:push"
  }
  if (msg.length > 280) {
    return "Something went wrong talking to the database."
  }
  return msg
}
