import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { clientTypeEnum } from "./enums"

export const clients = pgTable("clients", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  taxId:          text("tax_id"),
  address:        text("address"),
  phone:          text("phone"),
  email:          text("email"),
  type:           clientTypeEnum("type").notNull().default("retail"),
  creditLimit:    numeric("credit_limit", { precision: 12, scale: 2 }).notNull().default("0"),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  notes:          text("notes"),
  isActive:       boolean("is_active").notNull().default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const suppliers = pgTable("suppliers", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  taxId:          text("tax_id"),
  contactName:    text("contact_name"),
  phone:          text("phone"),
  email:          text("email"),
  address:        text("address"),
  paymentTerms:   numeric("payment_terms", { precision: 5, scale: 0 }).default("30"),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  notes:          text("notes"),
  isActive:       boolean("is_active").notNull().default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const clientsRelations = relations(clients, ({ one }) => ({
  tenant: one(tenants, { fields: [clients.tenantId], references: [tenants.id] }),
}))

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] }),
}))

export type Client = typeof clients.$inferSelect
export type Supplier = typeof suppliers.$inferSelect
export type NewClient = typeof clients.$inferInsert
