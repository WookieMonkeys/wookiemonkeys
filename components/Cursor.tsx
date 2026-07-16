'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Cursor.module.css'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const updateEnabled = () => setEnabled(pointerQuery.matches)

    updateEnabled()
    pointerQuery.addEventListener('change', updateEnabled)

    return () => pointerQuery.removeEventListener('change', updateEnabled)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = -200
    let mouseY = -200
    let ringX = -200
    let ringY = -200
    let visible = false
    let rafId: number

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (!visible) {
        visible = true
        ringX = mouseX
        ringY = mouseY
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }

      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`
    }

    const tick = () => {
      ringX = lerp(ringX, mouseX, 0.1)
      ringY = lerp(ringY, mouseY, 0.1)
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`
      rafId = requestAnimationFrame(tick)
    }

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-cursor], a, button')) {
        ring.classList.add(styles.hovered)
      }
    }

    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-cursor], a, button')) {
        ring.classList.remove(styles.hovered)
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    rafId = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(rafId)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring} />
    </>
  )
}
