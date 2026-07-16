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

export async function DELETE(req: Request) {
  // TODO: re-enable — if (!await verifyOwner(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, release_id, status } = await req.json()

  if (status === 'wanted') {
    await fetch(
      `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants/${release_id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Discogs token=${DISCOGS_TOKEN}`,
          'User-Agent': 'WookieMonkeys/1.0',
        },
      }
    )
  } else {
    // id is the instance_id for owned records
    await fetch(
      `https://api.discogs.com/users/${DISCOGS_USERNAME}/collection/folders/1/releases/${release_id}/instances/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Discogs token=${DISCOGS_TOKEN}`,
          'User-Agent': 'WookieMonkeys/1.0',
        },
      }
    )
  }

  const { error } = await getSupabase().from('vinyl_collection').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
