'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import styles from './bass.module.css'

// ── Music data ────────────────────────────────────────────────────────────────

const NOTE_NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const NOTE_NAMES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
const FLAT_KEY_INDICES = new Set([5, 10, 3, 8, 1]) // F, Bb, Eb, Ab, Db

const SCALES = {
  major:           { name: 'Major',            intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  naturalMinor:    { name: 'Natural Minor',    intervals: [0, 2, 3, 5, 7,  8, 10, 12] },
  pentatonicMajor: { name: 'Maj Pentatonic',   intervals: [0, 2, 4, 7, 9, 12] },
  pentatonicMinor: { name: 'Min Pentatonic',   intervals: [0, 3, 5, 7, 10, 12] },
  dorian:          { name: 'Dorian',           intervals: [0, 2, 3, 5, 7,  9, 10, 12] },
  mixolydian:      { name: 'Mixolydian',       intervals: [0, 2, 4, 5, 7,  9, 10, 12] },
  blues:           { name: 'Blues',            intervals: [0, 3, 5, 6, 7, 10, 12] },
} as const
type ScaleKey = keyof typeof SCALES


// ── Audio singleton ───────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

const LOOKAHEAD   = 25.0  // ms between scheduler calls
const SCHED_AHEAD = 0.1   // seconds to look ahead

// ── Music helpers ─────────────────────────────────────────────────────────────

function noteFreq(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12) }

function usesFlats(keyIndex: number) { return FLAT_KEY_INDICES.has(keyIndex) }

function keyName(keyIndex: number) {
  return usesFlats(keyIndex) ? NOTE_NAMES_FLAT[keyIndex] : NOTE_NAMES_SHARP[keyIndex]
}

// Staff position: 0 = G2 bottom line; even = line, odd = space
function midiToStaff(midi: number, flat: boolean): { pos: number; acc: '#'|'b'|null } {
  const octave = Math.floor(midi / 12) - 1
  const sem    = midi % 12
  const SHARP: [number, '#'|null][] = [
    [0,null],[0,'#'],[1,null],[1,'#'],[2,null],
    [3,null],[3,'#'],[4,null],[4,'#'],[5,null],[5,'#'],[6,null],
  ]
  const FLAT: [number, 'b'|null][] = [
    [0,null],[1,'b'],[1,null],[2,'b'],[2,null],
    [3,null],[4,'b'],[4,null],[5,'b'],[5,null],[6,'b'],[6,null],
  ]
  const [ls, acc] = flat ? FLAT[sem] : SHARP[sem]
  const cPos = -4 + (octave - 2) * 7   // C2 = pos -4 (two ledger lines below G2)
  return { pos: cPos + ls, acc: acc as '#'|'b'|null }
}

function getLedgers(pos: number): number[] {
  const lines: number[] = []
  if (pos < 0) {
    const lo = pos % 2 === 0 ? pos : pos + 1
    for (let p = -2; p >= lo; p -= 2) lines.push(p)
  } else if (pos > 8) {
    const hi = pos % 2 === 0 ? pos : pos - 1
    for (let p = 10; p <= hi; p += 2) lines.push(p)
  }
  return lines
}

function getScaleNotes(keyIndex: number, scaleKey: ScaleKey): number[] {
  // E2 (MIDI 40) is the lowest note on a standard bass (open E string, written pitch).
  // Keys C/C#/D/D# in octave 2 fall below that, so bump them up to octave 3.
  const base = 36 + keyIndex  // octave 2 root
  const root = base < 40 ? base + 12 : base
  return SCALES[scaleKey].intervals.map(i => root + i)
}

function noteName(midi: number, flat: boolean) {
  return (flat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[midi % 12]
}

// ── Staff SVG ─────────────────────────────────────────────────────────────────

const HP  = 9   // half-step pixels (distance between adjacent positions)
const NR  = 6   // note head radius
const CLW = 52  // clef width
const NX0 = CLW + 18 // first note x

interface SNData { pos: number; acc: '#'|'b'|null; label: string }

const SB = 90  // staff baseline — G2 is always at y=90 in internal coordinates
const py = (pos: number) => SB - pos * HP

function StaffSVG({ notes }: { notes: SNData[] }) {
  const W      = NX0 + notes.length * 52 + 16
  const minPos = notes.length ? Math.min(...notes.map(n => n.pos)) : 0

  // Fixed viewport: staff always centered with 50px padding on each side
  const VB_TOP = py(8) - 50      // 50px above top staff line (A3)
  const VB_BOT = py(0) + 50      // 50px below bottom staff line (G2)
  const VB_H   = VB_BOT - VB_TOP // constant height regardless of notes
  const labelY = Math.max(py(minPos) + 16, py(0) + 24)

  return (
    <svg width={W} height={VB_H} viewBox={`0 ${VB_TOP} ${W} ${VB_H}`} className={styles.staffSvg}>
      {/* Staff lines */}
      {[0,2,4,6,8].map(p => (
        <line key={p} x1={CLW} y1={py(p)} x2={W} y2={py(p)}
          stroke="currentColor" strokeWidth={1} opacity={0.35} />
      ))}

      {/* Bass clef: two dots flanking the F3 line */}
      <circle cx={CLW - 12} cy={py(7)} r={3} fill="currentColor" opacity={0.55} />
      <circle cx={CLW - 12} cy={py(5)} r={3} fill="currentColor" opacity={0.55} />

      {notes.map((n, i) => {
        const x  = NX0 + i * 52 + 20
        const y  = py(n.pos)
        const ld = getLedgers(n.pos)
        return (
          <g key={i}>
            {ld.map(lp => (
              <line key={lp} x1={x-NR-5} y1={py(lp)} x2={x+NR+5} y2={py(lp)}
                stroke="currentColor" strokeWidth={1.5} opacity={0.5} />
            ))}
            {n.acc && (
              <text x={x - NR - 8} y={y + 5} fontSize={13}
                fill="currentColor" textAnchor="middle">
                {n.acc === '#' ? '♯' : '♭'}
              </text>
            )}
            <ellipse cx={x} cy={y} rx={NR} ry={NR * 0.72} fill="currentColor" />
            <text x={x} y={labelY} fontSize={9} fill="currentColor"
              textAnchor="middle" opacity={0.4}>
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Tab SVG ───────────────────────────────────────────────────────────────────

// ── Drum synthesis ───────────────────────────────────────────────────────────

function synthKick(ctx: AudioContext, time: number) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, time)
  osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.45)
  gain.gain.setValueAtTime(1.0, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45)
  osc.start(time); osc.stop(time + 0.5)
}

function synthSnare(ctx: AudioContext, time: number) {
  const bufLen = Math.floor(ctx.sampleRate * 0.18)
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data   = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
  const noise  = ctx.createBufferSource()
  noise.buffer = buf
  const nhp    = ctx.createBiquadFilter()
  nhp.type     = 'highpass'
  nhp.frequency.value = 1500
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.5, time)
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
  noise.connect(nhp); nhp.connect(ng); ng.connect(ctx.destination)
  noise.start(time); noise.stop(time + 0.2)
  const osc  = ctx.createOscillator()
  const og   = ctx.createGain()
  osc.connect(og); og.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.value = 190
  og.gain.setValueAtTime(0.6, time)
  og.gain.exponentialRampToValueAtTime(0.001, time + 0.09)
  osc.start(time); osc.stop(time + 0.12)
}

function synthHihat(ctx: AudioContext, time: number, open: boolean) {
  const decay  = open ? 0.35 : 0.07
  const bufLen = Math.floor(ctx.sampleRate * (decay + 0.05))
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data   = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
  const src  = ctx.createBufferSource()
  src.buffer = buf
  const hp   = ctx.createBiquadFilter()
  hp.type    = 'highpass'
  hp.frequency.value = 7000
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(open ? 0.22 : 0.32, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay)
  src.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
  src.start(time); src.stop(time + decay + 0.01)
}

function synthTom(ctx: AudioContext, time: number) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(110, time)
  osc.frequency.exponentialRampToValueAtTime(55, time + 0.28)
  gain.gain.setValueAtTime(0.8, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
  osc.start(time); osc.stop(time + 0.35)
}

// ── Drum Machine ──────────────────────────────────────────────────────────────

const DRUM_TRACKS = [
  { id: 'kick',  name: 'Kick'  },
  { id: 'snare', name: 'Snare' },
  { id: 'hihat', name: 'HH ×'  },
  { id: 'open',  name: 'HH ○'  },
  { id: 'tom',   name: 'Tom'   },
] as const
type DrumId = typeof DRUM_TRACKS[number]['id']

const NUM_STEPS = 16
type DrumPattern = Record<DrumId, boolean[]>

function emptyPattern(): DrumPattern {
  return Object.fromEntries(
    DRUM_TRACKS.map(t => [t.id, Array(NUM_STEPS).fill(false)])
  ) as DrumPattern
}

function playDrumSound(ctx: AudioContext, time: number, id: DrumId) {
  switch (id) {
    case 'kick':  synthKick(ctx, time);         break
    case 'snare': synthSnare(ctx, time);        break
    case 'hihat': synthHihat(ctx, time, false); break
    case 'open':  synthHihat(ctx, time, true);  break
    case 'tom':   synthTom(ctx, time);          break
  }
}

function DrumMachine() {
  const [pattern, setPattern] = useState<DrumPattern>(emptyPattern)
  const [running, setRunning] = useState(false)
  const [bpm,     setBpm]     = useState(120)
  const [step,    setStep]    = useState(-1)

  const patternRef   = useRef(pattern)
  const bpmRef       = useRef(bpm)
  const currentStep  = useRef(0)
  const nextStepTime = useRef(0)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduledRef = useRef<{ time: number; step: number }[]>([])
  const rafRef       = useRef<number>(0)
  const runRef       = useRef(false)

  patternRef.current = pattern
  bpmRef.current     = bpm

  const scheduler = useCallback(() => {
    const ctx = getCtx()
    while (nextStepTime.current < ctx.currentTime + SCHED_AHEAD) {
      const s = currentStep.current
      DRUM_TRACKS.forEach(({ id }) => {
        if (patternRef.current[id][s]) playDrumSound(ctx, nextStepTime.current, id)
      })
      scheduledRef.current.push({ time: nextStepTime.current, step: s })
      currentStep.current  = (s + 1) % NUM_STEPS
      nextStepTime.current += 60 / (bpmRef.current * 4)
    }
    timerRef.current = setTimeout(scheduler, LOOKAHEAD)
  }, [])

  useEffect(() => {
    function frame() {
      if (!runRef.current) return
      const ctx = _ctx
      if (ctx) {
        const now = ctx.currentTime
        const sched = scheduledRef.current
        for (let i = sched.length - 1; i >= 0; i--) {
          if (sched[i].time <= now) {
            setStep(sched[i].step)
            scheduledRef.current = sched.slice(i)
            break
          }
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    if (running) { runRef.current = true;  rafRef.current = requestAnimationFrame(frame) }
    else         { runRef.current = false; cancelAnimationFrame(rafRef.current) }
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const start = useCallback(() => {
    const ctx = getCtx()
    currentStep.current  = 0
    nextStepTime.current = ctx.currentTime + 0.05
    scheduledRef.current = []
    setRunning(true)
    scheduler()
  }, [scheduler])

  const stop = useCallback(() => {
    setRunning(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setStep(-1)
  }, [])

  const toggle = useCallback(() => running ? stop() : start(), [running, start, stop])

  useEffect(() => {
    if (running) { stop(); start() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm])

  const toggleStep = useCallback((id: DrumId, i: number) => {
    setPattern(p => ({ ...p, [id]: p[id].map((v, idx) => idx === i ? !v : v) }))
  }, [])

  const PRESETS: { name: string; build: () => DrumPattern }[] = [
    {
      name: 'Basic',
      build() {
        const p = emptyPattern()
        p.kick[0] = p.kick[8] = true
        p.snare[4] = p.snare[12] = true
        for (let i = 0; i < NUM_STEPS; i += 2) p.hihat[i] = true
        return p
      },
    },
    {
      name: 'Funk',
      build() {
        const p = emptyPattern()
        p.kick[0] = p.kick[6] = p.kick[10] = true
        p.snare[4] = p.snare[12] = true
        for (let i = 0; i < NUM_STEPS; i++) p.hihat[i] = true
        p.open[6] = true
        return p
      },
    },
    {
      name: 'Half-time',
      build() {
        const p = emptyPattern()
        p.kick[0] = p.kick[2] = p.kick[12] = true
        p.snare[8] = true
        for (let i = 0; i < NUM_STEPS; i += 2) p.hihat[i] = true
        p.open[14] = true
        return p
      },
    },
    {
      name: 'Driving',
      build() {
        const p = emptyPattern()
        p.kick[0] = p.kick[4] = p.kick[8] = p.kick[12] = true
        p.snare[4] = p.snare[12] = true
        for (let i = 0; i < NUM_STEPS; i += 2) p.hihat[i] = true
        return p
      },
    },
    {
      name: 'Reggae',
      build() {
        const p = emptyPattern()
        p.kick[8] = true
        p.snare[4] = p.snare[12] = true
        for (let i = 0; i < NUM_STEPS; i += 2) p.hihat[i] = true
        p.open[0] = p.open[8] = true
        return p
      },
    },
  ]

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Drum Machine</h2>

      <div className={styles.bpmRow}>
        <button className={styles.nudge} onClick={() => setBpm(b => Math.max(30, b - 5))}>−5</button>
        <button className={styles.nudge} onClick={() => setBpm(b => Math.max(30, b - 1))}>−</button>
        <div className={styles.bpmDisplay}>
          <span className={styles.bpmNum}>{bpm}</span>
          <span className={styles.bpmLabel}>BPM</span>
        </div>
        <button className={styles.nudge} onClick={() => setBpm(b => Math.min(300, b + 1))}>+</button>
        <button className={styles.nudge} onClick={() => setBpm(b => Math.min(300, b + 5))}>+5</button>
      </div>
      <div className={styles.drumGrid}>
        {/* Beat markers */}
        <div className={styles.drumRow}>
          <span className={styles.drumLabel} />
          {Array.from({ length: NUM_STEPS }, (_, i) => (
            <span key={i} className={`${styles.stepNum} ${i % 4 === 0 ? styles.stepNumBeat : ''} ${step === i ? styles.stepNumActive : ''}`}>
              {i % 4 === 0 ? Math.floor(i / 4) + 1 : '·'}
            </span>
          ))}
        </div>

        {DRUM_TRACKS.map(track => (
          <div key={track.id} className={styles.drumRow}>
            <span className={styles.drumLabel}>{track.name}</span>
            {Array.from({ length: NUM_STEPS }, (_, i) => (
              <button
                key={i}
                onClick={() => toggleStep(track.id, i)}
                className={[
                  styles.stepBtn,
                  pattern[track.id][i] ? styles.stepBtnOn : '',
                  step === i ? styles.stepBtnCurrent : '',
                  i % 4 === 0 ? styles.stepBtnBeat : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </div>
        ))}
      </div>

      <div className={styles.drumFooter}>
        <button className={`${styles.playBtn} ${running ? styles.playBtnActive : ''}`} onClick={toggle}>
          {running ? '◼ Stop' : '▶ Play'}
        </button>
        {PRESETS.map(pr => (
          <button key={pr.name} className={styles.presetBtn} onClick={() => setPattern(pr.build())}>
            {pr.name}
          </button>
        ))}
        <button className={styles.presetBtn} onClick={() => setPattern(emptyPattern())}>Clear</button>
      </div>
    </section>
  )
}

// ── Scale Randomizer ──────────────────────────────────────────────────────────

function ScaleRandomizer({ onKeyChange }: { onKeyChange: (key: number) => void }) {
  const [keyIdx,   setKeyIdx]   = useState(0)
  const [scaleKey, setScaleKey] = useState<ScaleKey>('major')

  const randomize = useCallback(() => {
    const nextKey   = Math.floor(Math.random() * 12)
    const keys      = Object.keys(SCALES) as ScaleKey[]
    const nextScale = keys[Math.floor(Math.random() * keys.length)]
    setKeyIdx(nextKey)
    setScaleKey(nextScale)
    onKeyChange(nextKey)
  }, [onKeyChange])

  const handleKeyChange = (ki: number) => { setKeyIdx(ki); onKeyChange(ki) }

  const flat  = usesFlats(keyIdx)
  const notes = getScaleNotes(keyIdx, scaleKey)
  const staffNotes: SNData[] = notes.map(m => ({
    ...midiToStaff(m, flat),
    label: noteName(m, flat),
  }))
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Scale Randomizer</h2>

      <div className={styles.scaleHeader}>
        <span className={styles.scaleTitle}>
          {keyName(keyIdx)} {SCALES[scaleKey].name}
        </span>
        <button className={styles.randomBtn} onClick={randomize}>Randomize</button>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Key</label>
          <div className={styles.keyGrid}>
            {NOTE_NAMES_SHARP.map((_, i) => (
              <button
                key={i}
                className={`${styles.keyBtn} ${keyIdx === i ? styles.keyBtnActive : ''}`}
                onClick={() => handleKeyChange(i)}
              >
                {keyName(i)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Scale</label>
          <div className={styles.scaleList}>
            {(Object.keys(SCALES) as ScaleKey[]).map(k => (
              <button
                key={k}
                className={`${styles.scaleBtn} ${scaleKey === k ? styles.scaleBtnActive : ''}`}
                onClick={() => setScaleKey(k)}
              >
                {SCALES[k].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.notation}>
        <div className={styles.notationScroll}>
          <StaffSVG notes={staffNotes} />
        </div>
      </div>
    </section>
  )
}

// ── Drone ─────────────────────────────────────────────────────────────────────

function Drone({ keyIndex }: { keyIndex: number }) {
  const [active, setActive]     = useState(false)
  const [waveform, setWaveform] = useState<OscillatorType>('sine')
  const [volume, setVolume]     = useState(0.25)

  const oscRef  = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const flat = usesFlats(keyIndex)
  const midi = 36 + keyIndex  // root note at C2 range

  const startDrone = useCallback((wave: OscillatorType, vol: number, midi: number) => {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const filt = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    osc.type            = wave
    osc.frequency.value = noteFreq(midi)
    filt.type           = 'lowpass'
    filt.frequency.value = wave === 'sine' ? 4000 : 600
    filt.Q.value        = 0.8
    gain.gain.value     = vol

    osc.connect(filt)
    filt.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    oscRef.current  = osc
    gainRef.current = gain
  }, [])

  const stopDrone = useCallback(() => {
    if (oscRef.current) {
      oscRef.current.stop()
      oscRef.current  = null
      gainRef.current = null
    }
  }, [])

  // Update frequency when key changes without restarting
  useEffect(() => {
    if (oscRef.current) oscRef.current.frequency.value = noteFreq(midi)
  }, [midi])

  // Update volume live
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume
  }, [volume])

  // Restart drone if waveform changes while active
  useEffect(() => {
    if (active) {
      stopDrone()
      startDrone(waveform, volume, midi)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveform])

  const toggle = useCallback(() => {
    if (active) { stopDrone(); setActive(false) }
    else        { startDrone(waveform, volume, midi); setActive(true) }
  }, [active, stopDrone, startDrone, waveform, volume, midi])

  // Cleanup on unmount
  useEffect(() => () => stopDrone(), [stopDrone])

  const noteLbl = noteName(midi, flat)

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Drone</h2>

      <div className={styles.droneNote}>
        <span className={styles.droneNoteLabel}>Root</span>
        <span className={styles.droneNoteName}>{noteLbl}2</span>
        <span className={styles.droneFreq}>{noteFreq(midi).toFixed(1)} Hz</span>
      </div>

      <div className={styles.droneControls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Waveform</label>
          <div className={styles.waveRow}>
            {(['sine', 'triangle', 'sawtooth', 'square'] as OscillatorType[]).map(w => (
              <button
                key={w}
                className={`${styles.waveBtn} ${waveform === w ? styles.waveBtnActive : ''}`}
                onClick={() => setWaveform(w)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Volume</label>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            className={styles.slider}
            onChange={e => setVolume(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        className={`${styles.playBtn} ${active ? styles.playBtnActive : ''}`}
        onClick={toggle}
      >
        {active ? '◼ Stop Drone' : '▶ Start Drone'}
      </button>

      {active && (
        <div className={styles.droneWave}>
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              className={styles.droneBar}
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BassPage() {
  const [droneKey, setDroneKey] = useState(0)

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1 className={styles.heading}>Bass Practice</h1>

      <div className={styles.grid}>
        <DrumMachine />
        <ScaleRandomizer onKeyChange={setDroneKey} />
        <Drone keyIndex={droneKey} />
      </div>
    </main>
  )
}
