import Link from 'next/link'

const ITEMS: Record<string, string> = {
  'commercial': 'COMMERCIAL',
  'portrait-projects': 'PORTRAIT PROJECTS',
  'lifestyle': 'LIFESTYLE',
  'street': 'STREET',
  'about': 'ABOUT',
  'travel': 'TRAVEL',
  'motion': 'MOTION',
  'photo-series': 'PHOTO SERIES',
  'websites': 'WEBSITES',
}

const WEBSITES = [
  {
    title: 'Elissa Mentesana',
    href: 'https://elissamentesana.com/',
  },
  {
    title: 'Come And Find Us',
    href: 'https://www.comeandfindus.com',
  },
]

export function generateStaticParams() {
  return Object.keys(ITEMS).map(category => ({ category }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const title = ITEMS[category] ?? category.toUpperCase().replace(/-/g, ' ')

  if (category === 'websites') {
    return (
      <main style={{
        height: '100vh',
        overflowY: 'auto',
        padding: '96px 44px 140px',
      }}>
        <Link href="/" style={{
          position: 'fixed',
          top: '32px',
          left: '44px',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          fontWeight: 300,
          opacity: 0.55,
          textTransform: 'uppercase',
        }}>
          ← Back
        </Link>

        <section style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}>
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            letterSpacing: '0.22em',
            fontWeight: 300,
            opacity: 0.4,
          }}>
            WEBSITES
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
          }}>
            {WEBSITES.map(site => (
              <article key={site.href} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{
                  height: '420px',
                  border: '1px solid rgba(128, 128, 128, 0.22)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'rgba(128, 128, 128, 0.08)',
                }}>
                  <iframe
                    src={site.href}
                    title={site.title}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 0,
                      background: 'white',
                    }}
                  />
                </div>

                <a
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.14em',
                    fontWeight: 300,
                    opacity: 0.55,
                    textTransform: 'uppercase',
                  }}
                >
                  {site.title}
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (category === 'about') {
    return (
      <main style={{
        minHeight: '100vh',
        padding: '96px 44px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
      }}>
        <Link href="/" style={{
          position: 'fixed',
          top: '32px',
          left: '44px',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          fontWeight: 300,
          opacity: 0.55,
          textTransform: 'uppercase',
        }}>
          ← Back
        </Link>

        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.65rem',
          letterSpacing: '0.22em',
          fontWeight: 300,
          opacity: 0.4,
        }}>
          ABOUT ME????
        </p>

        <div style={{
          width: 'min(100%, 720px)',
          aspectRatio: '16 / 9',
        }}>
          <iframe
            src="https://tenor.com/embed/15559185"
            title="Wouldnt You Like To Know Weather Boy GIF"
            loading="lazy"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
    }}>
      <p style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.65rem',
        letterSpacing: '0.22em',
        fontWeight: 300,
        opacity: 0.4,
      }}>
        {title}
      </p>
      <Link href="/" style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.6rem',
        letterSpacing: '0.18em',
        fontWeight: 300,
        opacity: 0.55,
        textTransform: 'uppercase',
      }}>
        ← Back
      </Link>
    </main>
  )
}
