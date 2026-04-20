"use client"

import { useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

import { sendContactForm, type ContactFormResult } from "./actions"

export function ContactForm({ disabled }: { disabled: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [result, setResult] = useState<ContactFormResult | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    const form = formRef.current
    if (!form || disabled) return
    const fd = new FormData(form)
    startTransition(async () => {
      const r = await sendContactForm(fd)
      setResult(r)
      if (r.ok) {
        form.reset()
      }
    })
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground ring-1 ring-foreground/10 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative flex max-w-xl flex-col gap-5"
      noValidate
    >
      {/* Honeypot: leave hidden; bots often fill every field */}
      <div className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
        <label>
          Company
          <input name="_hp" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="text-sm text-muted-foreground">
        Name
        <input
          name="name"
          type="text"
          required
          maxLength={200}
          autoComplete="name"
          disabled={disabled || pending}
          className={inputClass}
        />
      </label>

      <label className="text-sm text-muted-foreground">
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          disabled={disabled || pending}
          className={inputClass}
        />
      </label>

      <label className="text-sm text-muted-foreground">
        Message
        <textarea
          name="message"
          required
          rows={8}
          maxLength={10000}
          disabled={disabled || pending}
          className={`${inputClass} min-h-[10rem] resize-y`}
        />
      </label>

      {result?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {result.error}
        </p>
      ) : null}
      {result?.ok === true ? (
        <p className="text-foreground/80 text-sm" role="status">
          Thanks — your message was sent.
        </p>
      ) : null}

      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
