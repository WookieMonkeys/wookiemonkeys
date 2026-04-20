/** URL-safe slug from a display name (may need uniqueness suffix at insert time). */
export function slugifyProjectName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72)
  return base.length > 0 ? base : "project"
}
