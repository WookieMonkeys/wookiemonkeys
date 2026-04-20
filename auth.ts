import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { AccessDenied, AuthError } from "@auth/core/errors"
import { eq } from "drizzle-orm"
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { NextResponse } from "next/server"

import { getDb } from "@/lib/db"
import { getPooledDatabaseUrl } from "@/lib/db/env"
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema"

function adminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Expected when `signIn` rejects non-allowlisted users — avoid `[auth][error]` + stack noise. */
function logAuthError(error: Error) {
  if (error instanceof AccessDenied) return

  const red = "\x1b[31m"
  const reset = "\x1b[0m"
  const name = error instanceof AuthError ? error.type : error.name
  console.error(`${red}[auth][error]${reset} ${name}: ${error.message}`)
  if (
    error.cause &&
    typeof error.cause === "object" &&
    "err" in error.cause &&
    error.cause.err instanceof Error
  ) {
    const { err, ...data } = error.cause as { err: Error } & Record<string, unknown>
    console.error(`${red}[auth][cause]${reset}:`, err.stack)
    if (Object.keys(data).length > 0) {
      console.error(`${red}[auth][details]${reset}:`, JSON.stringify(data, null, 2))
    }
  } else if (error.stack) {
    console.error(error.stack.replace(/.*/, "").substring(1))
  }
}

const drizzleAuthSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  authenticatorsTable: authenticators,
}

/**
 * Lazy config reads `process.env` when Auth runs so `AUTH_SECRET` is not baked in at
 * `next build` (Next can inline static `process.env.*` in server chunks).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const useDatabase = Boolean(getPooledDatabaseUrl())
  const trustHost = process.env.AUTH_TRUST_HOST !== "false"
  const providers = []

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
        // Allow GitHub <-> Google sign-in for the same verified email.
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        // Safe enough here because sign-in is restricted by ADMIN_ALLOWED_EMAILS.
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  return {
    trustHost,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    pages: {
      error: "/auth/error",
    },
    logger: {
      error: logAuthError,
    },
    ...(useDatabase
      ? { adapter: DrizzleAdapter(getDb(), drizzleAuthSchema) }
      : {}),
    providers,
    callbacks: {
      authorized({ request, auth }) {
        if (!request.nextUrl.pathname.startsWith("/admin")) {
          return true
        }
        if (!auth?.user) {
          return false
        }
        if (auth.user.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.nextUrl))
        }
        return true
      },
      async signIn({ user }) {
        const email = user.email?.toLowerCase()
        if (!email) return false
        const allow = adminAllowlist()
        if (allow.length === 0) return false
        return allow.includes(email)
      },
      async jwt({ token, profile }) {
        if (profile && "email" in profile && typeof profile.email === "string") {
          const email = profile.email.toLowerCase()
          token.role = adminAllowlist().includes(email) ? "admin" : "client"
        }
        return token
      },
      async session({ session, user, token }) {
        if (user) {
          session.user.id = user.id
          session.user.role = user.role
          return session
        }
        if (token?.sub) {
          session.user.id = token.sub
          session.user.role =
            (token.role as "admin" | "client" | undefined) ?? "client"
        }
        return session
      },
    },
    ...(useDatabase
      ? {
          events: {
            async createUser({ user }) {
              const email = user.email?.toLowerCase()
              if (!email || !user.id) return
              if (!adminAllowlist().includes(email)) return
              await getDb()
                .update(users)
                .set({ role: "admin" })
                .where(eq(users.id, user.id))
            },
          },
        }
      : {}),
  }
})
