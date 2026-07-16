import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function PATCH(req: Request) {
  const { id, notes } = await req.json()
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await getSupabase()
    .from('vinyl_collection')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('update-vinyl error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ ok: true })
}
