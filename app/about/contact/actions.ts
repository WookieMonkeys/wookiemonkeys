"use server"

import { sendContactEmail } from "@/lib/send-contact-email"

export type ContactFormResult = { ok: true } | { ok: false; error: string }

const MAX_NAME = 200
const MAX_EMAIL = 320
const MAX_MESSAGE = 10_000
const MIN_MESSAGE = 10

function simpleEmailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function sendContactForm(formData: FormData): Promise<ContactFormResult> {
  const hp = formData.get("_hp")
  if (typeof hp === "string" && hp.trim() !== "") {
    return { ok: true }
  }

  const nameRaw = formData.get("name")
  const emailRaw = formData.get("email")
  const messageRaw = formData.get("message")

  const name = typeof nameRaw === "string" ? nameRaw.trim() : ""
  const email = typeof emailRaw === "string" ? emailRaw.trim() : ""
  const message = typeof messageRaw === "string" ? messageRaw.trim() : ""

  if (!name) {
    return { ok: false, error: "Please enter your name." }
  }
  if (name.length > MAX_NAME) {
    return { ok: false, error: "Name is too long." }
  }
  if (!email || !simpleEmailOk(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (email.length > MAX_EMAIL) {
    return { ok: false, error: "Email is too long." }
  }
  if (message.length < MIN_MESSAGE) {
    return { ok: false, error: `Please write at least ${MIN_MESSAGE} characters.` }
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, error: "Message is too long." }
  }

  return sendContactEmail({ name, email, message })
}
