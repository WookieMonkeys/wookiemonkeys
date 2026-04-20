import { mergeDevelopmentLocalEnvIntoProcess } from "./lib/merge-development-local.mjs"

mergeDevelopmentLocalEnvIntoProcess()

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * `proxy.ts` (auth on `/admin`) buffers the full request body. Default is 10MB,
     * which truncates multipart image uploads and causes "Unexpected end of form".
     * Keep ≥ `serverActions.bodySizeLimit` and typical batch size (sum of files).
     */
    proxyClientMaxBodySize: "32mb",
    serverActions: {
      /** Must be ≤ `proxyClientMaxBodySize`; see `MAX_UPLOAD_BYTES_PER_FILE` in uploads-actions. */
      bodySizeLimit: "32mb",
    },
  },
}

export default nextConfig
