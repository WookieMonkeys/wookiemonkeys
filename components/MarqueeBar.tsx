'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './MarqueeBar.module.css'

function getMoonPhase(): string {
  const known = new Date(2000, 0, 6)
  const cycle = 29.53058867
  const days = (Date.now() - known.getTime()) / 86400000
  const phase = ((days % cycle) + cycle) % cycle
  if (phase < 1.85) return '🌑 NEW MOON'
  if (phase < 7.38) return '🌒 WAXING CRESCENT'
  if (phase < 9.22) return '🌓 FIRST QUARTER'
  if (phase < 14.77) return '🌔 WAXING GIBBOUS'
  if (phase < 16.61) return '🌕 FULL MOON'
  if (phase < 22.15) return '🌖 WANING GIBBOUS'
  if (phase < 23.99) return '🌗 LAST QUARTER'
  return '🌘 WANING CRESCENT'
}

const WMO_LABELS: Record<number, string> = {
  0: '☀',
  1: '🌤', 2: '⛅', 3: '☁',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌦',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '❄', 73: '❄', 75: '❄',
  80: '🌦', 81: '🌦', 82: '🌦',
  85: '🌨', 86: '🌨',
  95: '⛈', 96: '⛈', 99: '⛈',
}

async function fetchCity(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  const { city, town, village, state_code, country_code } = data.address
  const place = city ?? town ?? village ?? 'UNKNOWN'
  const region = country_code === 'us' ? (state_code?.toUpperCase() ?? '') : country_code?.toUpperCase() ?? ''
  return `${place.toUpperCase()}${region ? `, ${region}` : ''}`
}

function formatTime(raw: string): string {
  const [time, period] = raw.split(' ')
  const [h, m] = time.split(':')
  return `${h}:${m} ${period}`
}

function parseTime(raw: string): Date {
  const [time, period] = raw.split(' ')
  let [h, m, s] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  const d = new Date()
  d.setHours(h, m, s, 0)
  return d
}

async function fetchSunriseSunset(lat: number, lon: number): Promise<string> {
  const url = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&timezone=auto&date=today`
  const res = await fetch(url)
  const data = await res.json()
  const { sunrise, sunset } = data.results
  const now = new Date()
  const sunriseTime = parseTime(sunrise)
  const sunsetTime = parseTime(sunset)
  if (now < sunriseTime) return `SUNRISE ${formatTime(sunrise)}`
  if (now < sunsetTime) return `SUNSET ${formatTime(sunset)}`
  return `SUNRISE ${formatTime(sunrise)}`
}

async function fetchWeather(lat: number, lon: number): Promise<string> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability&temperature_unit=fahrenheit&timezone=auto`
  const res = await fetch(url)
  const data = await res.json()
  const { temperature, weathercode, time } = data.current_weather
  const label = WMO_LABELS[weathercode] ?? 'WEATHER'
  const hourIndex = (data.hourly.time as string[]).indexOf(time)
  const rainChance = hourIndex >= 0 ? data.hourly.precipitation_probability[hourIndex] : null
  const isSnow = [71, 73, 75, 77, 85, 86].includes(weathercode)
  const isThunder = [95, 96, 99].includes(weathercode)
  const isClear = [0, 1].includes(weathercode)

  let icon = label
  if (isThunder) {
    icon = '⛈'
  } else if (isSnow) {
    icon = rainChance !== null && rainChance >= 60 ? '🌨' : '❄'
  } else if (isClear && (rainChance === null || rainChance < 20)) {
    icon = '☀'
  } else if (rainChance !== null && rainChance >= 60) {
    icon = '🌧'
  } else if (rainChance !== null && rainChance >= 30) {
    icon = '🌦'
  }

  return `${icon} ${Math.round(temperature)}°F`
}

export default function MarqueeBar() {
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    const fallback = async () => {
      try {
        const [weather, sun] = await Promise.all([
          fetchWeather(40.6782, -73.9442),
          fetchSunriseSunset(40.6782, -73.9442),
        ])
        setItems(['BROOKLYN, NY', sun, weather, getMoonPhase()])
      } catch {}
    }

    if (!navigator.geolocation) {
      fallback()
      return
    }

    // Bail out to fallback if geolocation hangs (e.g. HTTP on iOS)
    const timeout = setTimeout(fallback, 5000)

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        clearTimeout(timeout)
        try {
          const [weather, sun, city] = await Promise.all([
            fetchWeather(coords.latitude, coords.longitude),
            fetchSunriseSunset(coords.latitude, coords.longitude),
            fetchCity(coords.latitude, coords.longitude),
          ])
          setItems([city, sun, weather, getMoonPhase()])
        } catch { fallback() }
      },
      () => { clearTimeout(timeout); fallback() },
    )

    return () => clearTimeout(timeout)
  }, [])

  const left = items.slice(0, 2)
  const right = items.slice(2)

  if (items.length === 0) return null

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 5, ease: 'easeIn' }}
    >
      <div className={styles.group}>
        {left.map((item, i) => (
          <span key={i} className={styles.item}>{item}</span>
        ))}
      </div>
      <div className={styles.group}>
        {right.map((item, i) => (
          <span key={i} className={styles.item}>{item}</span>
        ))}
      </div>
    </motion.div>
  )
}
