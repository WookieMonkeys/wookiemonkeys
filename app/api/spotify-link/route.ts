import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

let cachedToken: string | null = null
let tokenExpiry = 0

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken!
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const artist = searchParams.get('artist')
  const title = searchParams.get('title')

  if (!id || !artist || !title) return Response.json({ url: null })

  try {
    const token = await getSpotifyToken()
    const q = encodeURIComponent(`artist:${artist} album:${title}`)
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const data = await res.json()
    const album = data.albums?.items?.[0]
    const url: string | null = album?.external_urls?.spotify ?? null

    if (url) {
      await getSupabase().from('vinyl_collection').update({ spotify_url: url }).eq('id', id)
    }

    return Response.json({ url })
  } catch (e) {
    console.error('Spotify lookup failed:', e)
    return Response.json({ url: null })
  }
}
