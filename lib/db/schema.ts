import {
  boolean,
  date,
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

export const experienceType = pgEnum("experience_type", ["celebrate", "relax", "suggest"]);
export const planStatus = pgEnum("plan_status", [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "PROPOSALS_AVAILABLE",
  "SELECTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export const proposalStatus = pgEnum("proposal_status", ["DRAFT", "PUBLISHED", "SELECTED", "REJECTED", "WITHDRAWN"]);
export const eventPackageStatus = pgEnum("event_package_status", ["DRAFT", "SENT", "ACCEPTED", "CANCELLED"]);
export const packageProviderKind = pgEnum("package_provider_kind", ["SELF", "REGISTERED", "MANUAL"]);
export const eventOrigin = pgEnum("event_origin", ["CLIENT", "SUPPLIER"]);
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
export const supplierListingType = pgEnum("supplier_listing_type", [
  "VENUE",
  "BUFFET",
  "DECORATION_THEME",
  "SERVICE",
]);
export const supplierPriceUnit = pgEnum("supplier_price_unit", [
  "PER_EVENT",
  "PER_PERSON",
  "PER_DAY",
  "STARTING_AT",
]);
export const supplierListingStatus = pgEnum("supplier_listing_status", ["DRAFT", "PUBLISHED"]);

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
  administrationFeeBps: integer("administration_fee_bps").default(1000).notNull(),
  contractTemplateUrl: text("contract_template_url"),
  contractTemplatePathname: text("contract_template_pathname"),
  contractTemplateName: text("contract_template_name"),
  contractTemplateUploadedAt: timestamp("contract_template_uploaded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("service_categories_normalized_name_idx").on(table.normalizedName),
  index("service_categories_active_name_idx").on(table.active, table.name),
]);

export const supplierServices = pgTable("supplier_services", {
  supplierUserId: uuid("supplier_user_id").notNull().references(() => supplierProfiles.userId, { onDelete: "cascade" }),
  serviceCategoryId: uuid("service_category_id").notNull().references(() => serviceCategories.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.supplierUserId, table.serviceCategoryId] })]);

export const eventLocations = pgTable("event_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  normalizedAddress: text("normalized_address").notNull(),
  city: text("city"),
  state: text("state"),
  createdBySupplierId: uuid("created_by_supplier_id").references(() => supplierProfiles.userId, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("event_locations_address_idx").on(table.normalizedAddress),
  index("event_locations_name_idx").on(table.name),
]);

export const supplierListings = pgTable("supplier_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierUserId: uuid("supplier_user_id").notNull().references(() => supplierProfiles.userId, { onDelete: "cascade" }),
  type: supplierListingType("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull(),
  priceUnit: supplierPriceUnit("price_unit").notNull(),
  capacity: integer("capacity"),
  eventLocationId: uuid("event_location_id").references(() => eventLocations.id, { onDelete: "set null" }),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  status: supplierListingStatus("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("supplier_listings_supplier_idx").on(table.supplierUserId),
  index("supplier_listings_type_status_idx").on(table.type, table.status),
]);

export const supplierListingImages = pgTable("supplier_listing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => supplierListings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("supplier_listing_images_listing_idx").on(table.listingId),
  uniqueIndex("supplier_listing_images_pathname_idx").on(table.pathname),
]);

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
  occasion: text("occasion"),
  idea: text("idea"),
  city: text("city"),
  state: text("state"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  guests: integer("guests"),
  budgetLabel: text("budget_label"),
  status: planStatus("status").default("SUBMITTED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("plans_user_created_idx").on(table.userId, table.createdAt),
  index("plans_status_created_idx").on(table.status, table.createdAt),
]);

export const planServices = pgTable("plan_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("plan_services_plan_name_idx").on(table.planId, table.name),
  index("plan_services_plan_idx").on(table.planId),
]);

export const planStatusHistory = pgTable("plan_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  status: planStatus("status").notNull(),
  note: text("note"),
  changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("plan_status_history_plan_idx").on(table.planId, table.createdAt)]);

export const planProposals = pgTable("plan_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  totalCents: integer("total_cents").notNull(),
  status: proposalStatus("status").default("PUBLISHED").notNull(),
  validUntil: date("valid_until"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("plan_proposals_plan_idx").on(table.planId, table.createdAt)]);

export const planProposalItems = pgTable("plan_proposal_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id").notNull().references(() => planProposals.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => supplierListings.id, { onDelete: "set null" }),
  supplierUserId: uuid("supplier_user_id").references(() => supplierProfiles.userId, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("plan_proposal_items_proposal_idx").on(table.proposalId)]);

export const clientContacts = pgTable("client_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  whatsappNumber: text("whatsapp_number").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdBySupplierId: uuid("created_by_supplier_id").references(() => supplierProfiles.userId, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("client_contacts_whatsapp_idx").on(table.whatsappNumber),
  uniqueIndex("client_contacts_user_idx").on(table.userId),
]);

export const eventPackages = pgTable("event_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizerSupplierId: uuid("organizer_supplier_id").notNull().references(() => supplierProfiles.userId, { onDelete: "cascade" }),
  clientUserId: uuid("client_user_id").references(() => users.id, { onDelete: "set null" }),
  clientContactId: uuid("client_contact_id").references(() => clientContacts.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientWhatsapp: text("client_whatsapp"),
  eventType: text("event_type").notNull(),
  eventTitle: text("event_title").notNull(),
  eventDate: date("event_date"),
  eventLocation: text("event_location"),
  venueListingId: uuid("venue_listing_id").references(() => supplierListings.id, { onDelete: "set null" }),
  eventLocationId: uuid("event_location_id").references(() => eventLocations.id, { onDelete: "set null" }),
  origin: eventOrigin("origin").default("SUPPLIER").notNull(),
  status: eventPackageStatus("status").default("DRAFT").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  administrationFeeBps: integer("administration_fee_bps").notNull(),
  administrationFeeCents: integer("administration_fee_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("event_packages_supplier_idx").on(table.organizerSupplierId, table.createdAt),
  index("event_packages_client_idx").on(table.clientUserId, table.createdAt),
]);

export const eventPackageItems = pgTable("event_package_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  packageId: uuid("package_id").notNull().references(() => eventPackages.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  description: text("description"),
  providerKind: packageProviderKind("provider_kind").notNull(),
  providerSupplierId: uuid("provider_supplier_id").references(() => supplierProfiles.userId, { onDelete: "set null" }),
  providerName: text("provider_name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("event_package_items_package_idx").on(table.packageId, table.sortOrder)]);

export const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
};
