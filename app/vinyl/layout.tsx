'use client'

import { useEffect } from 'react'

export default function VinylLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])
  return <>{children}</>
}
