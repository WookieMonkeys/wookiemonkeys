import { createClient } from '@supabase/supabase-js'

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN!
const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME!

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

interface DiscogsRelease {
  id: number
  instance_id: number
  date_added: string
  basic_information: {
    id: number
    title: string
    year: number
    cover_image: string
    thumb: string
    artists: Array<{ name: string }>
    labels: Array<{ name: string }>
    genres: string[]
    styles: string[]
  }
}

interface DiscogsWant {
  id: number
  date_added: string
  basic_information: {
    id: number
    title: string
    year: number
    cover_image: string
    thumb: string
    artists: Array<{ name: string }>
    labels: Array<{ name: string }>
    genres: string[]
    styles: string[]
  }
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const items: T[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetch(`${url}&page=${page}&per_page=100`, {
      headers: {
        Authorization: `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'WookieMonkeys/1.0',
      },
    })
    if (!res.ok) throw new Error(`Discogs API error: ${res.status}`)
    const data = await res.json()
    totalPages = data.pagination.pages
    const key = 'releases' in data ? 'releases' : 'wants'
    items.push(...data[key])
    page++
  }

  return items
}

function stripArtistSuffix(name: string) {
  return name.replace(/\s*\(\d+\)$/, '')
}

export async function GET() {
  try {
    const [releases, wants] = await Promise.all([
      fetchAllPages<DiscogsRelease>(
        `https://api.discogs.com/users/${DISCOGS_USERNAME}/collection/folders/0/releases?`
      ),
      fetchAllPages<DiscogsWant>(
        `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants?`
      ),
    ])

    const ownedRecords = releases.map((r) => ({
      id: String(r.instance_id),
      release_id: r.basic_information.id,
      title: r.basic_information.title,
      artist: r.basic_information.artists.map((a) => stripArtistSuffix(a.name)).join(', '),
      year: r.basic_information.year || null,
      label: r.basic_information.labels?.[0]?.name ?? null,
      cover_image: r.basic_information.cover_image,
      thumb: r.basic_information.thumb,
      genres: r.basic_information.genres ?? [],
      styles: r.basic_information.styles ?? [],
      status: 'owned',
      added_at: r.date_added,
      updated_at: new Date().toISOString(),
    }))

    const wantedRecords = wants.map((w) => ({
      id: `want-${w.basic_information.id}`,
      release_id: w.basic_information.id,
      title: w.basic_information.title,
      artist: w.basic_information.artists.map((a) => stripArtistSuffix(a.name)).join(', '),
      year: w.basic_information.year || null,
      label: w.basic_information.labels?.[0]?.name ?? null,
      cover_image: w.basic_information.cover_image,
      thumb: w.basic_information.thumb,
      genres: w.basic_information.genres ?? [],
      styles: w.basic_information.styles ?? [],
      status: 'wanted',
      added_at: w.date_added,
      updated_at: new Date().toISOString(),
    }))

    const allRecords = [...ownedRecords, ...wantedRecords]

    const { error } = await getSupabase()
      .from('vinyl_collection')
      .upsert(allRecords, { onConflict: 'id' })

    if (error) throw error

    return Response.json({ owned: ownedRecords.length, wanted: wantedRecords.length })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
