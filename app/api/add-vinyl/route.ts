import { createClient } from '@supabase/supabase-js'

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN!
const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME!
const ALLOWED_USER = process.env.NEXT_PUBLIC_ALLOWED_GITHUB_USER!

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function verifyOwner(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const { data: { user } } = await authClient.auth.getUser(token)
  return user?.user_metadata?.user_name === ALLOWED_USER
}

export async function POST(req: Request) {
  // TODO: re-enable — if (!await verifyOwner(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { release_id, title, artist, year, label, cover_image, thumb, genres, styles, status } = body

  let id: string

  if (status === 'wanted') {
    // Add to Discogs wantlist
    const discogsRes = await fetch(
      `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants/${release_id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Discogs token=${DISCOGS_TOKEN}`,
          'User-Agent': 'WookieMonkeys/1.0',
        },
      }
    )
    if (!discogsRes.ok) {
      const err = await discogsRes.text()
      return Response.json({ error: `Discogs error: ${err}` }, { status: 500 })
    }
    // Wantlist items don't have an instance_id — use release_id prefixed
    id = `want-${release_id}`
  } else {
    // Add to Discogs collection
    const discogsRes = await fetch(
      `https://api.discogs.com/users/${DISCOGS_USERNAME}/collection/folders/0/releases/${release_id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Discogs token=${DISCOGS_TOKEN}`,
          'User-Agent': 'WookieMonkeys/1.0',
          'Content-Type': 'application/json',
        },
      }
    )
    if (!discogsRes.ok) {
      const err = await discogsRes.text()
      return Response.json({ error: `Discogs error: ${err}` }, { status: 500 })
    }
    const discogsData = await discogsRes.json()
    id = String(discogsData.instance_id)
  }

  const { error } = await getSupabase().from('vinyl_collection').upsert({
    id,
    release_id,
    title,
    artist,
    year,
    label,
    cover_image,
    thumb,
    genres: genres ?? [],
    styles: styles ?? [],
    status: status ?? 'owned',
    added_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, id })
}
