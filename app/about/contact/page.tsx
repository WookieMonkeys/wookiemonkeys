import type { Metadata } from "next"
import Link from "next/link"

import { ContactForm } from "@/app/about/contact/contact-form"
import { isContactFormConfigured } from "@/lib/contact-config"

export const metadata: Metadata = {
  title: "Contact | Elissa Mentesana",
}

export default function AboutContactPage() {
  const configured = isContactFormConfigured()

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-y-auto px-6 pb-10 md:pb-12"
      style={{ paddingTop: "var(--site-header-offset)" }}
    >
      <nav className="mb-6 text-sm">
        <Link
          href="/about"
          className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← About
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Contact
        </h1>
        <p className="mt-3 max-w-prose text-pretty text-muted-foreground">
          Send a note. Your address is set as Reply-To so we can write you back directly.
        </p>
      </header>

      {!configured ? (
        <div className="max-w-xl rounded-lg border border-foreground/15 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          This form is not configured yet. Add{" "}
          <code className="text-foreground/80">RESEND_API_KEY</code> in Vercel (or{" "}
          <code className="text-foreground/80">.env.local</code>), and set either{" "}
          <code className="text-foreground/80">CONTACT_TO_EMAIL</code> or at least one email in{" "}
          <code className="text-foreground/80">ADMIN_ALLOWED_EMAILS</code> — see{" "}
          <code className="text-foreground/80">.env.example</code>.
        </div>
      ) : null}

      <ContactForm disabled={!configured} />
    </div>
  )
}
