export type TrailImageSource = "wheel" | "polaroid"

/** Alias for the wheel swatch URLs (e.g. legacy call sites). */
export const PALETTE_SWATCHES = [
  "/wheel/deep-crimson.svg",
  "/wheel/faded-copper.svg",
  "/wheel/palm-leaf.svg",
  "/wheel/dry-sage.svg",
  "/wheel/beige.svg",
  "/wheel/russet.svg",
] as const

export const WHEEL_TRAIL_IMAGES = PALETTE_SWATCHES

/** Must match files in `public/polaroid/polaroid-{1..n}.jpg` (served as `/polaroid/...`). */
const POLAROID_TRAIL_COUNT = 38

export const POLAROID_TRAIL_IMAGES: readonly string[] = Array.from(
  { length: POLAROID_TRAIL_COUNT },
  (_, i) => `/polaroid/polaroid-${i + 1}.jpg`
)

export function trailImagesForSource(
  source: TrailImageSource
): readonly string[] {
  return source === "wheel" ? PALETTE_SWATCHES : POLAROID_TRAIL_IMAGES
}
