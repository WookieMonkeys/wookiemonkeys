import { Resend } from "resend"

import { getContactToEmail } from "@/lib/contact-config"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type SendContactEmailResult = { ok: true } | { ok: false; error: string }

/** Bare `you@verified.domain` or full `Name <you@verified.domain>`. */
function isBareEmail(s: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)
}

function buildResendFromHeader(): string {
  const raw = process.env.CONTACT_FROM_EMAIL?.trim()
  if (raw) {
    if (raw.includes("<") && raw.includes(">")) {
      return raw
    }
    if (isBareEmail(raw)) {
      const name =
        (process.env.CONTACT_FROM_NAME ?? "Elissa Mentesana").trim().replace(/[<>]/g, "").slice(0, 120) ||
        "Site"
      return `${name} <${raw}>`
    }
    return raw
  }
  const name = (process.env.CONTACT_FROM_NAME ?? "Elissa Mentesana").trim() || "Site"
  const safeName = name.replace(/[<>]/g, "").slice(0, 120)
  return `${safeName} <onboarding@resend.dev>`
}

/**
 * Sends the site owner a message via Resend (Vercel-friendly serverless).
 * `RESEND_API_KEY` + destination (see `getContactToEmail`).
 * From line: `CONTACT_FROM_EMAIL` as `Name <addr@your-domain>` or bare `addr@your-domain`
 * (uses `CONTACT_FROM_NAME` for the display part), else test `onboarding@resend.dev`.
 */
export async function sendContactEmail(input: {
  name: string
  email: string
  message: string
}): Promise<SendContactEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const to = getContactToEmail()
  const from = buildResendFromHeader()

  if (!apiKey || !to) {
    return { ok: false, error: "Contact form is not configured." }
  }

  const resend = new Resend(apiKey)
  const subject = `Contact: ${input.name.slice(0, 100)}`
  const text = `From: ${input.name}\nEmail: ${input.email}\n\n${input.message}`
  const html = `<p><strong>From:</strong> ${escapeHtml(input.name)}</p>
<p><strong>Email:</strong> <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></p>
<hr />
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(input.message)}</pre>`

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.email,
    subject,
    text,
    html,
  })

  if (error) {
    console.error("[contact] Resend:", "message" in error ? error.message : error)
    return { ok: false, error: "Could not send your message. Please try again later." }
  }

  return { ok: true }
}
