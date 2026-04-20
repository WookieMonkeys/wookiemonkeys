import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/** Auth.js default table name: `user` */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** `admin` for site owners; extend to `client` when you add client accounts. */
  role: text("role").notNull().default("client").$type<"admin" | "client">(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compoundKey: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

export type UserPreferencesData = Record<string, unknown>

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<UserPreferencesData>().notNull().$defaultFn(() => ({})),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * Photo folders (projects). Admins own projects; `visibleToClients` exposes the
 * folder on `/projects` for everyone (including future client accounts).
 */
export const projects = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** Globally unique for public URLs `/projects/[slug]`. */
  slug: text("slug").notNull().unique(),
  visibleToClients: boolean("visible_to_clients").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
})

/** Polaroid trail + project images (Vercel Blob; optional `projectId`). */
export const uploadedImages = pgTable("uploaded_image", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  originalName: text("original_name"),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
})
