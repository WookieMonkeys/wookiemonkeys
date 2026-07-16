'use client'

import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import styles from './LogoReveal.module.css'

export default function LogoReveal() {
  const [visible, setVisible] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if ((window as typeof window & { __wmIntroDone?: boolean }).__wmIntroDone) {
      setVisible(true)
    }

    const handler = () => setVisible(true)
    window.addEventListener('wm-intro-done', handler)
    return () => window.removeEventListener('wm-intro-done', handler)
  }, [])

  const src = theme === 'light' ? '/wookiemonkeys-black.webp' : '/wookiemonkeys-white.webp'

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Wookie Monkeys"
      className={styles.logo}
      style={{ opacity: visible ? 1 : 0 }}
    />
  )
}
