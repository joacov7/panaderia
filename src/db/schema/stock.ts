import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { categories, unitsOfMeasure } from "./catalogs"
import { users } from "./users"
import { stockEntityTypeEnum, stockMovementTypeEnum } from "./enums"

export const rawMaterials = pgTable("raw_materials", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId:   uuid("category_id").references(() => categories.id),
  unitId:       uuid("unit_id").notNull().references(() => unitsOfMeasure.id),
  name:         text("name").notNull(),
  sku:          text("sku"),
  stockCurrent: numeric("stock_current", { precision: 12, scale: 3 }).notNull().default("0"),
  stockMin:     numeric("stock_min", { precision: 12, scale: 3 }).notNull().default("0"),
  costPerUnit:  numeric("cost_per_unit", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive:     boolean("is_active").notNull().default(true),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable("products", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId:     uuid("category_id").references(() => categories.id),
  unitId:         uuid("unit_id").notNull().references(() => unitsOfMeasure.id),
  name:           text("name").notNull(),
  sku:            text("sku"),
  description:    text("description"),
  salePrice:      numeric("sale_price", { precision: 12, scale: 2 }).notNull().default("0"),
  wholesalePrice: numeric("wholesale_price", { precision: 12, scale: 2 }),
  stockCurrent:   numeric("stock_current", { precision: 12, scale: 3 }).notNull().default("0"),
  stockMin:       numeric("stock_min", { precision: 12, scale: 3 }).notNull().default("0"),
  isActive:       boolean("is_active").notNull().default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const stockMovements = pgTable("stock_movements", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  entityType:    stockEntityTypeEnum("entity_type").notNull(),
  entityId:      uuid("entity_id").notNull(),
  movementType:  stockMovementTypeEnum("movement_type").notNull(),
  quantity:      numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  stockAfter:    numeric("stock_after", { precision: 12, scale: 3 }).notNull(),
  unitCost:      numeric("unit_cost", { precision: 12, scale: 2 }),
  referenceId:   uuid("reference_id"),
  referenceType: text("reference_type"),
  notes:         text("notes"),
  createdBy:     text("created_by").references(() => users.id),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const rawMaterialsRelations = relations(rawMaterials, ({ one }) => ({
  tenant:   one(tenants, { fields: [rawMaterials.tenantId], references: [tenants.id] }),
  category: one(categories, { fields: [rawMaterials.categoryId], references: [categories.id] }),
  unit:     one(unitsOfMeasure, { fields: [rawMaterials.unitId], references: [unitsOfMeasure.id] }),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant:   one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  unit:     one(unitsOfMeasure, { fields: [products.unitId], references: [unitsOfMeasure.id] }),
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  createdBy: one(users, { fields: [stockMovements.createdBy], references: [users.id] }),
}))

export type RawMaterial = typeof rawMaterials.$inferSelect
export type Product = typeof products.$inferSelect
export type StockMovement = typeof stockMovements.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type NewRawMaterial = typeof rawMaterials.$inferInsert
