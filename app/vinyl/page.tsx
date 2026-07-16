'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import BarcodeScanner from '@/components/BarcodeScanner'
import styles from './vinyl.module.css'

const ALLOWED_USER = process.env.NEXT_PUBLIC_ALLOWED_GITHUB_USER

type Status = 'owned' | 'wanted'

interface VinylRecord {
  id: string
  release_id: number
  title: string
  artist: string
  year: number | null
  label: string | null
  cover_image: string
  thumb: string
  genres: string[]
  status: Status
  added_at: string
  notes: string | null
  spotify_url: string | null
}

interface SearchResult {
  release_id: number
  title: string
  thumb: string
  cover_image: string
  year: number | null
  label: string | null
  genres: string[]
  styles: string[]
  format: string[]
}

async function authFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  })
}

export default function VinylPage() {
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState<VinylRecord | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null)
  const [spotifyLoading, setSpotifyLoading] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOwner = true // TODO: re-enable — const isOwner = user?.user_metadata?.user_name === ALLOWED_USER

  const owned = records.filter((r) => r.status === 'owned')
  const wanted = records.filter((r) => r.status === 'wanted')

  useEffect(() => {
    loadRecords()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    const channel = supabase
      .channel('vinyl_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vinyl_collection' }, loadRecords)
      .subscribe()
    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (searching) inputRef.current?.focus()
  }, [searching])

  useEffect(() => {
    if (!selected) { setSpotifyUrl(null); return }
    if (selected.spotify_url) { setSpotifyUrl(selected.spotify_url); return }
    setSpotifyUrl(null)
    setSpotifyLoading(true)
    fetch(`/api/spotify-link?id=${selected.id}&artist=${encodeURIComponent(selected.artist)}&title=${encodeURIComponent(selected.title)}`)
      .then((r) => r.json())
      .then(({ url }) => {
        setSpotifyUrl(url)
        if (url) setSelected((prev) => prev ? { ...prev, spotify_url: url } : prev)
      })
      .finally(() => setSpotifyLoading(false))
  }, [selected?.id])

  async function loadRecords() {
    const { data } = await supabase
      .from('vinyl_collection')
      .select('*')
      .order('added_at', { ascending: false })
    if (data) setRecords(data)
  }

  async function sync() {
    setSyncing(true)
    await authFetch('/api/sync-vinyl')
    setSyncing(false)
  }

  function onQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!val.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(() => doSearch(val), 400)
  }

  async function onBarcodeDetected(barcode: string) {
    setScanning(false)
    setSearchLoading(true)
    setSearching(true)
    setQuery(barcode)
    const res = await fetch(`/api/scan-vinyl?barcode=${encodeURIComponent(barcode)}`)
    const data = await res.json()
    setResults(data.results ?? [])
    setSearchLoading(false)
  }

  async function doSearch(q: string) {
    setSearchLoading(true)
    const res = await fetch(`/api/search-vinyl?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.results ?? [])
    setSearchLoading(false)
  }

  async function addRecord(result: SearchResult, status: Status) {
    const key = `${status}-${result.release_id}`
    setAdding(key)
    const [artist, title] = result.title.includes(' - ')
      ? result.title.split(' - ').map((s: string) => s.trim())
      : ['', result.title]
    await authFetch('/api/add-vinyl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ release_id: result.release_id, title, artist, year: result.year, label: result.label, cover_image: result.cover_image, thumb: result.thumb, genres: result.genres, styles: result.styles, status }),
    })
    setAdding(null)
    setSearching(false)
    setQuery('')
    setResults([])
  }

  function toggleDeleteMode() {
    if (deleteMode && markedIds.size > 0) {
      confirmDelete()
    } else {
      setDeleteMode(!deleteMode)
      setMarkedIds(new Set())
      setSelected(null)
    }
  }

  function toggleMark(record: VinylRecord) {
    setMarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(record.id)) next.delete(record.id)
      else next.add(record.id)
      return next
    })
  }

  async function confirmDelete() {
    setDeleting(true)
    const toDelete = records.filter((r) => markedIds.has(r.id))
    await Promise.all(toDelete.map((record) =>
      authFetch('/api/delete-vinyl', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, release_id: record.release_id, status: record.status }),
      })
    ))
    setDeleteMode(false)
    setMarkedIds(new Set())
    setDeleting(false)
  }

  async function saveNotes() {
    if (!selected) return
    setSavingNotes(true)
    await authFetch('/api/update-vinyl', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, notes: notesValue }),
    })
    setSelected({ ...selected, notes: notesValue })
    setEditingNotes(false)
    setSavingNotes(false)
  }

  function openNotes() {
    setNotesValue(selected?.notes ?? '')
    setEditingNotes(true)
  }

  function closeSearch() {
    setSearching(false)
    setQuery('')
    setResults([])
  }

  return (
    <div className={styles.root}>
    <main className={styles.page}>

      {/* Grid view */}
      {owned.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>HAVE</p>
          <div className={styles.grid}>
            {owned.map((record) => (
              <button
                key={record.id}
                className={`${styles.album} ${deleteMode && markedIds.has(record.id) ? styles.albumMarked : ''}`}
                onClick={() => {
                  if (deleteMode) { toggleMark(record); return }
                  setSelected(selected?.id === record.id ? null : record)
                  setEditingNotes(false)
                }}
              >
                <div className={styles.cover}>
                  {record.cover_image ? <img src={record.cover_image} alt={record.title} loading="lazy" /> : <div className={styles.placeholder}>♪</div>}
                  {deleteMode && <div className={styles.deleteMark}>{markedIds.has(record.id) ? '✕' : ''}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
      {wanted.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>WANT</p>
          <div className={styles.grid}>
            {wanted.map((record) => (
              <button
                key={record.id}
                className={`${styles.album} ${deleteMode && markedIds.has(record.id) ? styles.albumMarked : ''}`}
                onClick={() => {
                  if (deleteMode) { toggleMark(record); return }
                  setSelected(selected?.id === record.id ? null : record)
                  setEditingNotes(false)
                }}
              >
                <div className={styles.cover}>
                  {record.cover_image ? <img src={record.cover_image} alt={record.title} loading="lazy" /> : <div className={styles.placeholder}>♪</div>}
                  {deleteMode && <div className={styles.deleteMark}>{markedIds.has(record.id) ? '✕' : ''}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Detail modal */}
      {selected && (
        <div className={styles.modal} onClick={() => setSelected(null)}>
          <div className={styles.modalInner} onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setSelected(null)}>×</button>
            {selected.cover_image
              ? <img className={styles.modalCover} src={selected.cover_image} alt={selected.title} />
              : <div className={`${styles.modalCover} ${styles.placeholder}`}>♪</div>
            }
            <div className={styles.modalInfo}>
              <h2 className={styles.modalTitle}>{selected.title}</h2>
              <p className={styles.modalArtist}>{selected.artist}</p>
              {selected.year && <p className={styles.modalMeta}>{selected.year}</p>}
              {selected.label && <p className={styles.modalMeta}>{selected.label}</p>}
              {(selected.genres?.length > 0 || spotifyUrl || spotifyLoading) && (
                <div className={styles.tags}>
                  {selected.genres?.map((g) => <span key={g} className={styles.tag}>{g}</span>)}
                  {(spotifyUrl || spotifyLoading) && (
                    <a
                      className={`${styles.spotifyBtn} ${spotifyLoading ? styles.spotifyLoading : ''}`}
                      href={spotifyUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Listen on Spotify"
                      onClick={(e) => { if (!spotifyUrl) e.preventDefault() }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {/* Notes */}
              {isOwner && editingNotes ? (
                <div className={styles.notesEdit}>
                  <textarea
                    className={styles.notesTextarea}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="add a note…"
                    autoFocus
                    rows={3}
                  />
                  <div className={styles.notesActions}>
                    <button className={styles.notesSave} onClick={saveNotes} disabled={savingNotes}>
                      {savingNotes ? 'saving…' : 'save'}
                    </button>
                    <button className={styles.notesCancel} onClick={() => setEditingNotes(false)}>cancel</button>
                  </div>
                </div>
              ) : (
                <div className={styles.notesView} onClick={isOwner ? openNotes : undefined}>
                  {selected.notes
                    ? <p className={styles.notesText}>{selected.notes}</p>
                    : isOwner && <p className={styles.notesEmpty}>+ note</p>
                  }
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Barcode scanner */}
      {scanning && (
        <BarcodeScanner
          onDetect={onBarcodeDetected}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Search overlay */}
      {searching && (
        <div className={styles.overlay} onClick={closeSearch}>
          <div className={styles.searchPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchBar}>
              <input ref={inputRef} className={styles.searchInput} placeholder="Search Discogs…" value={query} onChange={onQueryChange} />
              <button className={styles.close} onClick={closeSearch}>×</button>
            </div>
            <div className={styles.results}>
              {searchLoading && <p className={styles.hint}>searching…</p>}
              {!searchLoading && query && results.length === 0 && <p className={styles.hint}>no results</p>}
              {results.map((r) => (
                <div key={r.release_id} className={styles.result}>
                  <div className={styles.resultThumb}>
                    {r.thumb ? <img src={r.thumb} alt={r.title} /> : <div className={styles.placeholder}>♪</div>}
                  </div>
                  <div className={styles.resultInfo}>
                    <p className={styles.resultTitle}>{r.title}</p>
                    <p className={styles.resultMeta}>{[r.year, r.label, r.format?.[0]].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className={styles.resultActions}>
                    <button className={styles.addRecordBtn} onClick={() => addRecord(r, 'owned')} disabled={adding !== null}>{adding === `owned-${r.release_id}` ? '…' : 'have'}</button>
                    <button className={styles.addRecordBtn} onClick={() => addRecord(r, 'wanted')} disabled={adding !== null}>{adding === `wanted-${r.release_id}` ? '…' : 'want'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>

    {/* Admin FAB — right side (outside main to avoid overflow clipping) */}
    {isOwner && (
      <div className={styles.fab}>
        {!deleteMode && (
          <>
            <button className={styles.syncBtn} onClick={sync} disabled={syncing}>{syncing ? 'syncing…' : 'sync'}</button>
            <button className={styles.addBtn} onClick={() => setSearching(true)}>+ add</button>
            <button className={styles.scanBtn} onClick={() => setScanning(true)}>scan</button>
          </>
        )}
        {deleteMode && (
          <button className={styles.deleteCancelBtn} onClick={() => { setDeleteMode(false); setMarkedIds(new Set()) }}>cancel</button>
        )}
        <button
          className={deleteMode && markedIds.size > 0 ? styles.deleteConfirmBtn : styles.deleteModeBtn}
          onClick={toggleDeleteMode}
          disabled={deleting}
        >
          {deleting ? 'removing…' : deleteMode ? (markedIds.size > 0 ? `remove ${markedIds.size}` : 'tap records') : 'remove'}
        </button>
      </div>
    )}
    </div>
  )
}
