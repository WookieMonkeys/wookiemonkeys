'use client'

import { useTheme } from './ThemeProvider'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button className={styles.button} onClick={toggle}>
      {theme === 'dark' ? 'LIGHT' : 'DARK'}
    </button>
  )
}
