"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { saveMyPreferences } from "./actions"

export function AdminPreferencesForm({
  initialJson,
}: {
  initialJson: string
}) {
  const [text, setText] = useState(initialJson)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    let parsed: Record<string, unknown>
    try {
      const value = JSON.parse(text) as unknown
      if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        throw new Error("Preferences must be a JSON object.")
      }
      parsed = value as Record<string, unknown>
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
      return
    }
    startTransition(async () => {
      try {
        await saveMyPreferences(parsed)
        setSaved(true)
      } catch {
        setError("Could not save preferences.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-medium tracking-tight">
          Preferences
        </CardTitle>
        <CardDescription>
          JSON stored in Neon per user. Merged on save with existing keys.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            name="preferences"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="border-foreground/15 bg-background font-mono text-sm ring-1 ring-foreground/10 focus-visible:ring-ring min-h-[12rem] w-full resize-y rounded-lg px-3 py-2 outline-none focus-visible:ring-2"
            aria-label="Preferences JSON"
          />
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="text-foreground/70 text-sm">Saved.</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
