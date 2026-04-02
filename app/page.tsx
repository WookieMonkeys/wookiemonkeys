import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CursorTrailSection } from "@/components/cursor-trail-section"

const PALETTE = [
  { hex: "#931F1D", name: "Deep Crimson" },
  { hex: "#937B63", name: "Faded Copper" },
  { hex: "#8A9B68", name: "Palm Leaf" },
  { hex: "#B6C197", name: "Dry Sage" },
  { hex: "#D5DDBC", name: "Beige" },
] as const

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-6 py-12 md:py-16">
      <div className="flex w-full max-w-4xl flex-col items-center gap-12">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Wookie Monkeys
          </h1>
          <p className="text-pretty text-muted-foreground">
            Building something worth howling about.
          </p>
        </div>

        <CursorTrailSection className="w-full">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Scroll the page or move through this panel — small images stamp along
              your pointer path.
            </p>
            <Button size="lg">Get in touch</Button>
          </div>
        </CursorTrailSection>

        <Card className="w-full max-w-lg text-left">
          <CardHeader>
            <CardTitle>Palette</CardTitle>
            <CardDescription>Colors used across the brand.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PALETTE.map((c) => (
                <li
                  key={c.hex}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <span
                    className="size-10 shrink-0 rounded-md border border-foreground/10 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      {c.hex}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
