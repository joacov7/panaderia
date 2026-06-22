import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { planTypeEnum, tenantStatusEnum } from "./enums"

export const tenants = pgTable("tenants", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  slug:      text("slug").notNull().unique(),
  plan:      planTypeEnum("plan").notNull().default("trial"),
  status:    tenantStatusEnum("status").notNull().default("active"),
  settings:  jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
