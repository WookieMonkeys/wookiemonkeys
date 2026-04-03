"use client"

import * as React from "react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { trailImagesForSource } from "@/lib/trail-image-sets"

const MIN_MOVE_PX_MOUSE = 24
const MIN_MOVE_PX_TOUCH = 8
const MAX_NODES = 56
/** Portrait stamp frame: width and instant-film aspect (~3.5×4.2) for wheel + polaroid. */
const STAMP_FRAME_WIDTH = 104
const STAMP_FRAME_ASPECT = 4.2 / 3.5
/**
 * Polaroid stamp width = {@link STAMP_FRAME_WIDTH} × scale.
 * Narrow = below Tailwind `md` (max-width 767px); wide = `md` and up.
 */
const POLAROID_STAMP_SCALE_NARROW = 1.75
const POLAROID_STAMP_SCALE_WIDE = 3
const POLAROID_STAMP_MQ = "(max-width: 767px)"

/** Slight scale on polaroid photos (frame has overflow-hidden). */
const POLAROID_IMAGE_ZOOM_CLASS = "origin-center scale-[1.07]"

/** Polaroid border cycle: rainbow order (red → … → blue). */
const POLAROID_BORDER_RAINBOW = [
  "#e41b13", // Polaroid Crimson
  "#f1860e", // Polaroid Golden Bell (Orange)
  "#fdc800", // Polaroid Supernova (Yellow)
  "#1ba548", // Polaroid Forest Green
  "#00a3e2", // Polaroid Cerulean
] as const

type CursorTrailSectionProps = {
  children: React.ReactNode
  className?: string
  intro?: React.ReactNode
  /** Grow the trail section to fill remaining flex height (e.g. viewport). */
  fillHeight?: boolean
}

export function CursorTrailSection({
  children,
  className,
  intro,
  fillHeight,
}: CursorTrailSectionProps) {
  const interactiveAreaRef = React.useRef<HTMLDivElement>(null)
  const trailLayerRef = React.useRef<HTMLDivElement>(null)
  const lastRef = React.useRef({ x: 0, y: 0, ready: false })
  const stampIndexRef = React.useRef(0)
  const polaroidBorderIndexRef = React.useRef(0)
  const reduceMotionRef = React.useRef(true)
  const [polaroidOn, setPolaroidOn] = React.useState(true)
  const polaroidOnRef = React.useRef(true)
  polaroidOnRef.current = polaroidOn

  const trailImagesRef = React.useRef<readonly string[]>(
    trailImagesForSource("polaroid")
  )
  trailImagesRef.current = trailImagesForSource("polaroid")

  const polaroidScaleRef = React.useRef(POLAROID_STAMP_SCALE_WIDE)

  const clearStamps = React.useCallback(() => {
    trailLayerRef.current?.replaceChildren()
    lastRef.current.ready = false
    polaroidBorderIndexRef.current = 0
  }, [])

  React.useLayoutEffect(() => {
    const mq = window.matchMedia(POLAROID_STAMP_MQ)
    const sync = () => {
      polaroidScaleRef.current = mq.matches
        ? POLAROID_STAMP_SCALE_NARROW
        : POLAROID_STAMP_SCALE_WIDE
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduceMotionRef.current = mq.matches
    const onChange = () => {
      reduceMotionRef.current = mq.matches
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  React.useEffect(() => {
    if (!interactiveAreaRef.current || !trailLayerRef.current) return

    function isInside(clientX: number, clientY: number) {
      const el = interactiveAreaRef.current
      if (!el) return false
      const r = el.getBoundingClientRect()
      return (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      )
    }

    function spawnNode(clientX: number, clientY: number) {
      if (reduceMotionRef.current) return

      const areaEl = interactiveAreaRef.current
      const trailLayerEl = trailLayerRef.current
      if (!areaEl || !trailLayerEl) return

      const r = areaEl.getBoundingClientRect()
      const x = clientX - r.left
      const y = clientY - r.top

      const images = trailImagesRef.current
      if (images.length === 0) return

      const frameW = Math.round(STAMP_FRAME_WIDTH * polaroidScaleRef.current)
      const frameH = Math.round(frameW * STAMP_FRAME_ASPECT)
      const src = images[stampIndexRef.current % images.length]!
      stampIndexRef.current += 1

      while (trailLayerEl.childElementCount > MAX_NODES) {
        trailLayerEl.removeChild(trailLayerEl.firstElementChild!)
      }

      const node = document.createElement("div")
      node.className = cn(
        "pointer-events-none absolute select-none",
        "opacity-100 transition-transform duration-200 ease-out",
        "scale-95 will-change-transform",
        "overflow-hidden rounded-md shadow-md",
        "border border-solid bg-background"
      )
      {
        const n = POLAROID_BORDER_RAINBOW.length
        const i = polaroidBorderIndexRef.current % n
        polaroidBorderIndexRef.current += 1
        node.style.borderColor = POLAROID_BORDER_RAINBOW[i]!
      }
      node.style.left = `${x - (frameW * 3) / 4}px`
      node.style.top = `${y - (frameH * 3) / 4}px`
      node.style.width = `${frameW}px`
      node.style.height = `${frameH}px`
      node.setAttribute("aria-hidden", "true")

      const img = document.createElement("img")
      img.src = src
      img.alt = ""
      img.width = frameW
      img.height = frameH
      img.className = cn(
        "h-full w-full object-center object-contain",
        POLAROID_IMAGE_ZOOM_CLASS
      )
      img.decoding = "async"
      node.appendChild(img)

      trailLayerEl.appendChild(node)

      requestAnimationFrame(() => {
        node.classList.remove("scale-95")
        node.classList.add("scale-100")
      })
    }

    function maybeSpawn(
      clientX: number,
      clientY: number,
      force: boolean,
      minMovePx: number = MIN_MOVE_PX_MOUSE
    ) {
      if (!isInside(clientX, clientY)) {
        lastRef.current.ready = false
        return
      }
      if (reduceMotionRef.current) return
      if (!polaroidOnRef.current) return

      const last = lastRef.current
      if (!last.ready) {
        last.x = clientX
        last.y = clientY
        last.ready = true
        spawnNode(clientX, clientY)
        return
      }

      if (!force) {
        const dx = clientX - last.x
        const dy = clientY - last.y
        if (dx * dx + dy * dy < minMovePx * minMovePx) return
      }

      last.x = clientX
      last.y = clientY
      spawnNode(clientX, clientY)
    }

    function onPointerMove(e: PointerEvent) {
      if (reduceMotionRef.current) return

      const areaEl = interactiveAreaRef.current
      if (!areaEl) return

      if (e.pointerType !== "mouse") {
        const captured = areaEl.hasPointerCapture(e.pointerId)
        if (!captured && !isInside(e.clientX, e.clientY)) return
      }

      const minPx =
        e.pointerType === "touch" ? MIN_MOVE_PX_TOUCH : MIN_MOVE_PX_MOUSE
      maybeSpawn(e.clientX, e.clientY, false, minPx)
    }

    function onPointerDown(e: PointerEvent) {
      if (reduceMotionRef.current) return
      if (e.pointerType === "mouse") return

      const target = e.target
      if (
        target instanceof Element &&
        target.closest(
          "button, a[href], input, textarea, select, [role='button']"
        )
      ) {
        return
      }

      const areaEl = interactiveAreaRef.current
      if (!areaEl) return
      if (!isInside(e.clientX, e.clientY)) return

      areaEl.setPointerCapture(e.pointerId)
      lastRef.current.ready = false
      maybeSpawn(e.clientX, e.clientY, true, MIN_MOVE_PX_TOUCH)
    }

    function onPointerEnd(e: PointerEvent) {
      const areaEl = interactiveAreaRef.current
      if (areaEl?.hasPointerCapture(e.pointerId)) {
        areaEl.releasePointerCapture(e.pointerId)
      }
      lastRef.current.ready = false
    }

    const onScroll = () => {
      const last = lastRef.current
      if (!last.ready) return
      if (!isInside(last.x, last.y)) {
        last.ready = false
        return
      }
      maybeSpawn(last.x, last.y, true)
    }

    const areaEl = interactiveAreaRef.current
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })
    areaEl.addEventListener("pointerdown", onPointerDown)
    areaEl.addEventListener("pointerup", onPointerEnd)
    areaEl.addEventListener("pointercancel", onPointerEnd)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", onScroll, true)
      areaEl.removeEventListener("pointerdown", onPointerDown)
      areaEl.removeEventListener("pointerup", onPointerEnd)
      areaEl.removeEventListener("pointercancel", onPointerEnd)
      trailLayerRef.current?.replaceChildren()
    }
  }, [])

  const polaroidToggle = (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <span className="text-sm text-muted-foreground">Polaroids</span>
      <Switch
        size="sm"
        className="border-transparent data-checked:border-[#728557] data-checked:bg-[#8A9B68]"
        checked={polaroidOn}
        onCheckedChange={(checked) => {
          if (!checked) {
            lastRef.current.ready = false
            clearStamps()
          }
          setPolaroidOn(checked)
        }}
      />
    </label>
  )

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        fillHeight && "min-h-0 flex-1"
      )}
    >
      {intro}

      <section
        className={cn(
          "relative isolate w-full touch-manipulation overflow-hidden",
          fillHeight
            ? "min-h-0 flex-1 bg-transparent"
            : "flex min-h-[min(55vh,28rem)] flex-col rounded-2xl border border-border bg-background",
          className
        )}
        aria-label="Interactive area: drag your finger or move the pointer to leave a short image trail."
      >
        {fillHeight ? (
          <>
            <div
              ref={interactiveAreaRef}
              className="absolute inset-0 z-0 flex flex-col"
            >
              <div
                className={cn(
                  "relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-6",
                  React.Children.count(children) > 0 ? "py-16 pt-14" : "py-2"
                )}
              >
                {children}
              </div>
              <div
                ref={trailLayerRef}
                className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
                aria-hidden
              />
            </div>
            <div className="pointer-events-none absolute right-4 bottom-4 z-30 sm:right-6 sm:bottom-6">
              <div className="pointer-events-auto rounded-lg border border-border/50 bg-background/90 px-3 py-2 shadow-sm backdrop-blur-sm">
                {polaroidToggle}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative z-[8] shrink-0 border-b border-border px-4 py-3 sm:px-6">
              <div className="flex justify-center">{polaroidToggle}</div>
            </div>
            <div
              ref={interactiveAreaRef}
              className="relative flex min-h-0 w-full flex-1 flex-col"
            >
              <div
                className={cn(
                  "relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-6",
                  React.Children.count(children) > 0 ? "py-16 pt-14" : "py-2"
                )}
              >
                {children}
              </div>
              <div
                ref={trailLayerRef}
                className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
                aria-hidden
              />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
