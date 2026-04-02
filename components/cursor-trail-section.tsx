"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const PALETTE_SWATCHES = [
  "/wheel/deep-crimson.svg",
  "/wheel/faded-copper.svg",
  "/wheel/palm-leaf.svg",
  "/wheel/dry-sage.svg",
  "/wheel/beige.svg",
  "/wheel/russet.svg",
] as const

const MIN_MOVE_PX = 14
const MAX_NODES = 36
const NODE_SIZE = 44
const LIFETIME_MS = 720

type CursorTrailSectionProps = {
  children: React.ReactNode
  className?: string
  intro?: React.ReactNode
}

export function CursorTrailSection({
  children,
  className,
  intro,
}: CursorTrailSectionProps) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const trailLayerRef = React.useRef<HTMLDivElement>(null)
  const lastRef = React.useRef({ x: 0, y: 0, ready: false })
  const stampIndexRef = React.useRef(0)
  const reduceMotionRef = React.useRef(true)
  const [showTrailUi, setShowTrailUi] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduceMotionRef.current = mq.matches
    setShowTrailUi(!mq.matches)
    const onChange = () => {
      reduceMotionRef.current = mq.matches
      setShowTrailUi(!mq.matches)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  React.useEffect(() => {
    if (!sectionRef.current || !trailLayerRef.current) return

    function isInside(clientX: number, clientY: number) {
      const el = sectionRef.current
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

      const sectionEl = sectionRef.current
      const trailLayerEl = trailLayerRef.current
      if (!sectionEl || !trailLayerEl) return

      const r = sectionEl.getBoundingClientRect()
      const x = clientX - r.left
      const y = clientY - r.top

      const src = PALETTE_SWATCHES[stampIndexRef.current % PALETTE_SWATCHES.length]!
      stampIndexRef.current += 1

      while (trailLayerEl.childElementCount > MAX_NODES) {
        trailLayerEl.removeChild(trailLayerEl.firstElementChild!)
      }

      const node = document.createElement("div")
      node.className = cn(
        "pointer-events-none absolute select-none",
        "opacity-90 transition-[transform,opacity] duration-[700ms] ease-out",
        "scale-75 will-change-transform"
      )
      node.style.left = `${x - NODE_SIZE / 2}px`
      node.style.top = `${y - NODE_SIZE / 2}px`
      node.style.width = `${NODE_SIZE}px`
      node.style.height = `${NODE_SIZE}px`
      node.setAttribute("aria-hidden", "true")

      const img = document.createElement("img")
      img.src = src
      img.alt = ""
      img.width = NODE_SIZE
      img.height = NODE_SIZE
      img.className =
        "h-full w-full rounded-md border border-foreground/15 object-cover shadow-sm"
      img.decoding = "async"
      node.appendChild(img)

      trailLayerEl.appendChild(node)

      requestAnimationFrame(() => {
        node.classList.remove("scale-75")
        node.classList.add("scale-110", "opacity-0")
      })

      window.setTimeout(() => {
        node.remove()
      }, LIFETIME_MS)
    }

    function maybeSpawn(clientX: number, clientY: number, force: boolean) {
      if (!isInside(clientX, clientY)) {
        lastRef.current.ready = false
        return
      }
      if (reduceMotionRef.current) return

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
        if (dx * dx + dy * dy < MIN_MOVE_PX * MIN_MOVE_PX) return
      }

      last.x = clientX
      last.y = clientY
      spawnNode(clientX, clientY)
    }

    const onMove = (e: MouseEvent) => maybeSpawn(e.clientX, e.clientY, false)
    const onScroll = () => {
      const last = lastRef.current
      if (!last.ready) return
      if (!isInside(last.x, last.y)) {
        last.ready = false
        return
      }
      maybeSpawn(last.x, last.y, true)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("scroll", onScroll, true)
      trailLayerRef.current?.replaceChildren()
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-0">
      {intro}

      <section
        ref={sectionRef}
        className={cn(
          "relative isolate min-h-[min(55vh,28rem)] w-full overflow-hidden rounded-2xl border border-border bg-muted/30",
          className
        )}
        aria-label="Interactive area: move the pointer to leave a short image trail."
      >
        <div className="relative z-[1] flex min-h-[inherit] flex-col items-center justify-center px-6 py-16 pt-14">
          {children}
        </div>

        <div
          ref={trailLayerRef}
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
          aria-hidden
        />

        {showTrailUi ? (
          <p className="pointer-events-none absolute inset-x-0 top-3 z-[6] text-center text-xs text-muted-foreground">
            Move the cursor through this area — images appear along the path.
          </p>
        ) : (
          <p className="pointer-events-none absolute inset-x-0 top-3 z-[6] text-center text-xs text-muted-foreground">
            Cursor trail is off when reduced motion is enabled.
          </p>
        )}
      </section>
    </div>
  )
}
