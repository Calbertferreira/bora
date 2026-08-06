import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const experienceType = pgEnum("experience_type", ["celebrate", "relax"]);
export const appRole = pgEnum("app_role", ["ADMIN", "STAFF", "SUPPLIER", "CLIENT"]);
export const accountStatus = pgEnum("account_status", [
  "PENDING",
  "UNDER_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "BLOCKED",
  "REJECTED",
  "INACTIVE",
]);
export const invitationStatus = pgEnum("invitation_status", ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]);

// Better Auth identity table. Domain-specific information lives in userProfiles.
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("accounts_provider_account_idx").on(table.providerId, table.accountId),
  index("accounts_user_id_idx").on(table.userId),
]);

export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("verifications_identifier_idx").on(table.identifier)]);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  whatsappNumber: text("whatsapp_number").notNull(),
  whatsappName: text("whatsapp_name").notNull(),
  status: accountStatus("status").default("PENDING").notNull(),
  acceptsOperationalMessages: boolean("accepts_operational_messages").default(true).notNull(),
  acceptsMarketing: boolean("accepts_marketing").default(false).notNull(),
  acceptedTermsAt: timestamp("accepted_terms_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: appRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.role] })]);

export const supplierProfiles = pgTable("supplier_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  serviceCategory: text("service_category").notNull(),
  document: text("document"),
  approvalStatus: accountStatus("approval_status").default("UNDER_REVIEW").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const internalInvitations = pgTable("internal_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: appRole("role").notNull(),
  whatsappNumber: text("whatsapp_number"),
  whatsappName: text("whatsapp_name"),
  tokenHash: text("token_hash").notNull().unique(),
  status: invitationStatus("status").default("PENDING").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  acceptedBy: uuid("accepted_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("internal_invitations_email_idx").on(table.email),
  index("internal_invitations_status_idx").on(table.status),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_actor_idx").on(table.actorUserId),
  index("audit_logs_target_idx").on(table.targetUserId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export const venues = pgTable("venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  capacity: integer("capacity").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: experienceType("type").notNull(),
  title: text("title").notNull(),
  guests: integer("guests"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
};
