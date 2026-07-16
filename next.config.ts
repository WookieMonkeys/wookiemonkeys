import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'

// Only init Cloudflare dev bindings locally — Vercel uses standard next build
if (!process.env.VERCEL) {
  initOpenNextCloudflareForDev()
}

const config: NextConfig = {
  allowedDevOrigins: ['172.20.10.12'],
}

export default config
