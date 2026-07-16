'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useAnimation } from 'framer-motion'
import styles from './Intro.module.css'

const SKIP_ROUTES = ['/admin']
const BALL = 64
const SMALL_LOGO_W = 56

export default function Intro() {
  const pathname = usePathname()
  const ballControls = useAnimation()
  const logoControls = useAnimation()
  const [ballDone, setBallDone] = useState(false)
  const logoImgRef = useRef<HTMLImageElement>(null)

  if (SKIP_ROUTES.includes(pathname)) return null

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'dark'
    if (logoImgRef.current) {
      logoImgRef.current.src = theme === 'light' ? '/wookiemonkeys-black.webp' : '/wookiemonkeys-white.webp'
    }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const finalLogoW = Math.min(Math.max(100, vw * 0.16), 400)

    ballControls.set({
      opacity: 1,
      width: BALL,
      height: BALL,
      x: -(BALL / 2),
      y: -(vh / 2 + BALL),
      borderRadius: BALL / 2,
    })

    logoControls.set({
      width: SMALL_LOGO_W,
      x: -(SMALL_LOGO_W / 2),
      y: -8,
    })

    async function sequence() {
      await ballControls.start({
        y: -(BALL / 2),
        transition: { type: 'spring', stiffness: 60, damping: 14 },
      })

      await new Promise<void>((r) => setTimeout(r, 300))

      await ballControls.start({
        width: vw,
        height: vh,
        x: -(vw / 2),
        y: -(vh / 2),
        borderRadius: 0,
        transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] },
      })

      // Trigger marquee at the same moment the logo starts moving
      window.dispatchEvent(new CustomEvent('wm-logo-moving'))

      // Logo moves from center of screen up to the top
      await logoControls.start({
        width: finalLogoW,
        x: -(finalLogoW / 2),
        y: -(vh / 2 - 24),
        transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
      })

      // Signal LogoReveal to appear at the same position, then unmount
      ;(window as typeof window & { __wmIntroDone?: boolean }).__wmIntroDone = true
      window.dispatchEvent(new CustomEvent('wm-intro-done'))
      await new Promise<void>((r) => setTimeout(r, 16))
      setBallDone(true)
    }

    sequence()
  }, [ballControls, logoControls])

  if (ballDone) return null

  return (
    <>
      <div className={styles.whiteBg} />
      <motion.div
        className={styles.ball}
        initial={{ opacity: 0 }}
        animate={ballControls}
      >
        <motion.img
          ref={logoImgRef}
          src="/wookiemonkeys-white.webp"
          alt="Wookie Monkeys"
          className={styles.ballLogo}
          initial={{ width: SMALL_LOGO_W, x: -(SMALL_LOGO_W / 2), y: -14 }}
          animate={logoControls}
        />
      </motion.div>
    </>
  )
}
