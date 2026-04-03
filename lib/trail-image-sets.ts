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

export const POLAROID_TRAIL_IMAGES = [
  "/polaroid/Denver16_websize.jpg",
  "/polaroid/LA18_websize.jpg",
  "/polaroid/LA19_websize.jpg",
  "/polaroid/LA20_websize.jpg",
  "/polaroid/LA21_websize.jpg",
  "/polaroid/LA22_websize.jpg",
  "/polaroid/Lawrence17_websize.jpg",
  "/polaroid/Lawrence18_websize.jpg",
  "/polaroid/Lawrence19_websize.jpg",
  "/polaroid/Lawrence20_websize.jpg",
  "/polaroid/Lawrence21_websize.jpg",
  "/polaroid/Polaroid1_websize.jpg",
  "/polaroid/Polaroid2_websize.jpg",
  "/polaroid/Polaroid3_websize.jpg",
  "/polaroid/Polaroid4_websize.jpg",
  "/polaroid/Polaroid5_websize.jpg",
  "/polaroid/Polaroid54_websize.jpg",
  "/polaroid/Polaroid55_websize.jpg",
  "/polaroid/Polaroid56_websize.jpg",
  "/polaroid/Polaroid57_websize.jpg",
  "/polaroid/Polaroid58_websize.jpg",
  "/polaroid/Polaroid59_websize.jpg",
  "/polaroid/Polaroid6_websize.jpg",
  "/polaroid/Polaroid60_websize.jpg",
  "/polaroid/Polaroid61_websize.jpg",
  "/polaroid/Polaroid62_websize.jpg",
  "/polaroid/Polaroid63_websize.jpg",
  "/polaroid/Polaroid64_websize.jpg",
  "/polaroid/Polaroid7_websize.jpg",
  "/polaroid/Portland23_websize.jpg",
  "/polaroid/Portland24_websize.jpg",
  "/polaroid/Portland25_websize.jpg",
  "/polaroid/Portland26_websize.jpg",
  "/polaroid/Portland27_websize.jpg",
  "/polaroid/Portland28_websize.jpg",
  "/polaroid/SF30_websize.jpg",
  "/polaroid/Utah13_websize.jpg",
  "/polaroid/Utah14_websize.jpg",
] as const

export function trailImagesForSource(
  source: TrailImageSource
): readonly string[] {
  return source === "wheel" ? PALETTE_SWATCHES : POLAROID_TRAIL_IMAGES
}
