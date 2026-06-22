import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { stockCategoryTypeEnum } from "./enums"

export const unitsOfMeasure = pgTable("units_of_measure", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  type:      stockCategoryTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const unitsRelations = relations(unitsOfMeasure, ({ one }) => ({
  tenant: one(tenants, { fields: [unitsOfMeasure.tenantId], references: [tenants.id] }),
}))

export const categoriesRelations = relations(categories, ({ one }) => ({
  tenant: one(tenants, { fields: [categories.tenantId], references: [tenants.id] }),
}))

export type UnitOfMeasure = typeof unitsOfMeasure.$inferSelect
export type Category = typeof categories.$inferSelect
