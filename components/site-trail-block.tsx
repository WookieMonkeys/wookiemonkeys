"use client"

import { CursorTrailSection } from "@/components/cursor-trail-section"

type SiteTrailBlockProps = {
  fillHeight?: boolean
}

export function SiteTrailBlock({ fillHeight }: SiteTrailBlockProps) {
  return (
    <CursorTrailSection fillHeight={fillHeight} className="w-full">
      {null}
    </CursorTrailSection>
  )
}
