/** First comma-separated admin allowlist address (trimmed), if any. */
export function primaryAdminEmail(): string | undefined {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? ""
  const first = raw.split(",")[0]?.trim()
  return first || undefined
}

/**
 * Inbox for contact form submissions: `CONTACT_TO_EMAIL`, else first `ADMIN_ALLOWED_EMAILS`.
 */
export function getContactToEmail(): string | undefined {
  const explicit = process.env.CONTACT_TO_EMAIL?.trim()
  if (explicit) return explicit
  return primaryAdminEmail()
}

export function isContactFormConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getContactToEmail())
}
