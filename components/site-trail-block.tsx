"use client"

import { CursorTrailSection } from "@/components/cursor-trail-section"

type SiteTrailBlockProps = {
  fillHeight?: boolean
  polaroidImageUrls?: readonly string[]
}

export function SiteTrailBlock({
  fillHeight,
  polaroidImageUrls,
}: SiteTrailBlockProps) {
  return (
    <CursorTrailSection
      fillHeight={fillHeight}
      className="w-full"
      polaroidImageUrls={polaroidImageUrls}
    >
      {null}
    </CursorTrailSection>
  )
}
