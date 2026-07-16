import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.+)$/)
  if (m) env[m[1]] = m[2].trim()
}

const DISCOGS_TOKEN = env.DISCOGS_TOKEN
const DISCOGS_USERNAME = env.DISCOGS_USERNAME
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY

const ALBUMS = [
  { artist: 'Michael Jackson', title: 'Thriller' },
  { artist: 'Fleetwood Mac', title: 'Rumours' },
  { artist: 'The Beatles', title: 'Abbey Road' },
  { artist: 'Led Zeppelin', title: 'Led Zeppelin IV' },
  { artist: 'Pink Floyd', title: 'The Dark Side of the Moon' },
  { artist: 'Eagles', title: 'Hotel California' },
  { artist: 'Prince', title: 'Purple Rain' },
  { artist: 'AC/DC', title: 'Back in Black' },
  { artist: 'Guns N\'s Roses', title: 'Appetite for Destruction' },
  { artist: 'Nirvana', title: 'Nevermind' },
  { artist: 'Bruce Springsteen', title: 'Born in the U.S.A.' },
  { artist: 'U2', title: 'The Joshua Tree' },
  { artist: 'David Bowie', title: 'Let\'s Dance' },
  { artist: 'Madonna', title: 'Like a Virgin' },
  { artist: 'Whitney Houston', title: 'Whitney Houston' },
  { artist: 'Bob Dylan', title: 'Blood on the Tracks' },
  { artist: 'Marvin Gaye', title: 'What\'s Going On' },
  { artist: 'The Rolling Stones', title: 'Exile on Main St.' },
  { artist: 'Alanis Morissette', title: 'Jagged Little Pill' },
  { artist: 'Shania Twain', title: 'Come On Over' },
  { artist: 'Lauryn Hill', title: 'The Miseducation of Lauryn Hill' },
  { artist: 'Eminem', title: 'The Marshall Mathers LP' },
  { artist: 'Jay-Z', title: 'The Blueprint' },
  { artist: 'OutKast', title: 'Speakerboxxx/The Love Below' },
  { artist: 'Kanye West', title: 'The College Dropout' },
  { artist: 'Alicia Keys', title: 'Songs in A Minor' },
  { artist: 'Norah Jones', title: 'Come Away with Me' },
  { artist: 'Coldplay', title: 'A Rush of Blood to the Head' },
  { artist: 'Amy Winehouse', title: 'Back to Black' },
  { artist: 'Justin Timberlake', title: 'FutureSex/LoveSounds' },
  { artist: 'Adele', title: '21' },
  { artist: 'Drake', title: 'Take Care' },
  { artist: 'Beyoncé', title: 'Lemonade' },
  { artist: 'Kendrick Lamar', title: 'good kid, m.A.A.d city' },
  { artist: 'Frank Ocean', title: 'Channel Orange' },
  { artist: 'Taylor Swift', title: '1989' },
  { artist: 'Daft Punk', title: 'Random Access Memories' },
  { artist: 'Arctic Monkeys', title: 'AM' },
  { artist: 'White Stripes', title: 'Elephant' },
  { artist: 'The Strokes', title: 'Is This It' },
  { artist: 'Radiohead', title: 'OK Computer' },
  { artist: 'R.E.M.', title: 'Automatic for the People' },
  { artist: 'Arcade Fire', title: 'The Suburbs' },
  { artist: 'LCD Soundsystem', title: 'Sound of Silver' },
  { artist: 'Vampire Weekend', title: 'Contra' },
  { artist: 'Bon Iver', title: 'Bon Iver, Bon Iver' },
  { artist: 'The National', title: 'Trouble Will Find Me' },
  { artist: 'St. Vincent', title: 'Strange Mercy' },
  { artist: 'Sufjan Stevens', title: 'Carrie & Lowell' },
  { artist: 'Interpol', title: 'Turn On the Bright Lights' },
]

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function searchDiscogs(artist, title) {
  const q = encodeURIComponent(`${artist} ${title}`)
  const res = await fetch(
    `https://api.discogs.com/database/search?q=${q}&type=release&per_page=3`,
    {
      headers: {
        Authorization: `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'WookieMonkeys/1.0',
      },
    }
  )
  const data = await res.json()
  // prefer results with a cover image
  const results = data.results ?? []
  return results.find((r) => r.cover_image && !r.cover_image.includes('spacer')) ?? results[0] ?? null
}

async function addToWantlist(releaseId) {
  const res = await fetch(
    `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants/${releaseId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'WookieMonkeys/1.0',
      },
    }
  )
  return res.ok
}

async function upsertSupabase(record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vinyl_collection`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(record),
  })
  return res.ok
}

async function run() {
  let added = 0
  let failed = 0

  for (const { artist, title } of ALBUMS) {
    try {
      process.stdout.write(`  searching: ${artist} – ${title} … `)

      const result = await searchDiscogs(artist, title)
      if (!result) {
        console.log('not found')
        failed++
        await delay(1100)
        continue
      }

      const releaseId = result.id
      const [parsedArtist, parsedTitle] = result.title?.includes(' - ')
        ? result.title.split(' - ').map((s) => s.trim())
        : [artist, title]

      const ok = await addToWantlist(releaseId)
      if (!ok) {
        console.log('wantlist add failed')
        failed++
        await delay(1100)
        continue
      }

      const record = {
        id: `want-${releaseId}`,
        release_id: releaseId,
        title: parsedTitle,
        artist: parsedArtist,
        year: result.year ? parseInt(result.year) : null,
        label: result.label?.[0] ?? null,
        cover_image: result.cover_image ?? '',
        thumb: result.thumb ?? '',
        genres: result.genre ?? [],
        styles: result.style ?? [],
        status: 'wanted',
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await upsertSupabase(record)
      console.log(`✓ added (${releaseId})`)
      added++
    } catch (e) {
      console.log(`error: ${e.message}`)
      failed++
    }

    // Discogs rate limit: 60 req/min — wait ~1.1s between requests
    await delay(1100)
  }

  console.log(`\ndone — ${added} added, ${failed} failed`)
}

run()
