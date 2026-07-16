'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './BarcodeScanner.module.css'

interface Props {
  onDetect: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const detectedRef = useRef(false)

  useEffect(() => {
    let controls: { stop: () => void } | null = null

    async function start() {
      if (!videoRef.current) return

      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')

        if (!videoRef.current) return

        const reader = new BrowserMultiFormatReader()
        const videoEl = videoRef.current

        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoEl,
          (result, err) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true
              controls?.stop()
              onDetect(result.getText())
            }
            void err
          }
        )
      } catch (e) {
        setError('Camera access denied or not available.')
        console.error(e)
      }
    }

    start()
    return () => { controls?.stop() }
  }, [onDetect])

  return (
    <div className={styles.overlay}>
      <button className={styles.close} onClick={onClose}>×</button>

      {error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <video ref={videoRef} className={styles.video} muted playsInline />
          <div className={styles.frame}>
            <div className={styles.corner} data-pos="tl" />
            <div className={styles.corner} data-pos="tr" />
            <div className={styles.corner} data-pos="bl" />
            <div className={styles.corner} data-pos="br" />
          </div>
          <p className={styles.hint}>point at the barcode on the back of the sleeve</p>
        </>
      )}
    </div>
  )
}
