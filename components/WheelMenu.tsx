'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from 'framer-motion'
import styles from './WheelMenu.module.css'

const ITEMS = [
  { label: 'PHOTOS', href: 'https://www.instagram.com/wookiemonkeys/' },
  { label: 'MUSIC', href: 'https://open.spotify.com/artist/2wMknlekLTOb4vRWn61NO5' },
  { label: 'RESUME', href: '/work/resume' },
  { label: 'WEBSITES', href: '/work/websites' },
  { label: 'BASS', href: '/work/bass' },
  { label: 'VINYL', href: '/vinyl' },
  { label: 'ABOUT', href: '/work/about' },
]

const N = ITEMS.length
const SPREAD = 80
const STEP = SPREAD / (N - 1)
const CYCLE = N * STEP
const INITIAL_ACTIVE = Math.floor(N / 2)

function wrapAngle(raw: number): number {
  const half = SPREAD / 2 + STEP / 2
  return ((raw + half) % CYCLE + CYCLE) % CYCLE - half
}

function Spoke({ item, index, totalScroll }: {
  item: (typeof ITEMS)[number]
  index: number
  totalScroll: MotionValue<number>
}) {
  const isExternal = item.href.startsWith('http')
  const base = -SPREAD / 2 + STEP * index

  const spokeAngle = useTransform(totalScroll, ts => wrapAngle(base - ts * STEP))
  const labelAngle = useTransform(spokeAngle, a => -a)

  // Buffer zone between SPREAD/2 and SPREAD/2+STEP/2 is where items teleport — keep them invisible
  const bufferCutoff = SPREAD / 2 + STEP * 0.45

  const opacity = useTransform(spokeAngle, a => {
    const abs = Math.abs(a)
    if (abs >= bufferCutoff) return 0
    return 1
  })

  const pointerEvents = useTransform(opacity, op =>
    op < 0.05 ? 'none' : 'auto',
  )

  const rayOpacity = useTransform(spokeAngle, a => {
    const abs = Math.abs(a)
    if (abs >= bufferCutoff) return 0
    const t = 1 - Math.min(1, abs / (SPREAD / 2))
    return 0.04 + t * 0.16
  })

  return (
    <motion.div className={styles.spoke} style={{ rotate: spokeAngle }}>
      <motion.div className={styles.ray} style={{ opacity: rayOpacity }} />
      <div className={styles.labelWrapper}>
        <motion.div style={{ rotate: labelAngle }}>
          <motion.span className={styles.label} style={{ opacity, pointerEvents }}>
            <Link
              href={item.href}
              className={styles.box}
              data-cursor=""
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              tabIndex={-1}
            >
              {item.label}
            </Link>
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function WheelMenu() {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(INITIAL_ACTIVE)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const w = window as typeof window & { __wmIntroDone?: boolean }
    if (w.__wmIntroDone) {
      setVisible(true)
      return
    }
    const onDone = () => setVisible(true)
    window.addEventListener('wm-intro-done', onDone)
    return () => window.removeEventListener('wm-intro-done', onDone)
  }, [])

  const totalScrollMV = useMotionValue(0)
  const totalScroll = useSpring(totalScrollMV, { stiffness: 100, damping: 30 })
  const positionRef = useRef(0)
  const bufferRef = useRef(0)
  const touchStartY = useRef<number | null>(null)

  useMotionValueEvent(totalScroll, 'change', ts => {
    setActiveIndex(((INITIAL_ACTIVE + Math.round(ts)) % N + N) % N)
  })

  const step = useCallback((dir: number) => {
    positionRef.current += dir
    totalScrollMV.set(positionRef.current)
  }, [totalScrollMV])

  const onWheel = useCallback((e: React.WheelEvent) => {
    bufferRef.current += e.deltaY
    if (Math.abs(bufferRef.current) < 50) return
    const steps = Math.sign(bufferRef.current) * Math.floor(Math.abs(bufferRef.current) / 50)
    bufferRef.current = 0
    positionRef.current += steps
    totalScrollMV.set(positionRef.current)
  }, [totalScrollMV])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dy) < 28) return
    step(dy < 0 ? 1 : -1)
    touchStartY.current = e.touches[0].clientY
  }, [step])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    } else if (e.key === 'Enter') {
      const href = ITEMS[activeIndex].href
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
    }
  }, [step, activeIndex, router])

  return (
    <motion.div
      className={styles.container}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label="Work categories"
      aria-activedescendant={`category-${activeIndex}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
    >
      <div className={styles.source}>
        {ITEMS.map((item, i) => (
          <Spoke key={item.label} item={item} index={i} totalScroll={totalScroll} />
        ))}
      </div>
    </motion.div>
  )
}
