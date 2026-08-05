import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const experienceType = pgEnum("experience_type", ["celebrate", "relax"]);
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
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
