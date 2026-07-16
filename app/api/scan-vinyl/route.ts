const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get('barcode')
  if (!barcode) return Response.json({ results: [] })

  const res = await fetch(
    `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&per_page=5`,
    {
      headers: {
        Authorization: `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'WookieMonkeys/1.0',
      },
    }
  )

  if (!res.ok) return Response.json({ error: 'Discogs lookup failed' }, { status: 500 })

  const data = await res.json()

  const results = data.results.map((r: {
    id: number
    title: string
    thumb: string
    cover_image: string
    year: string
    label: string[]
    genre: string[]
    style: string[]
    format: string[]
  }) => ({
    release_id: r.id,
    title: r.title,
    thumb: r.thumb,
    cover_image: r.cover_image,
    year: r.year ? parseInt(r.year) : null,
    label: r.label?.[0] ?? null,
    genres: r.genre ?? [],
    styles: r.style ?? [],
    format: r.format ?? [],
  }))

  return Response.json({ results })
}
