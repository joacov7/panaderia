import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { users } from "./users"
import { recipes } from "./recipes"
import { products } from "./stock"
import { productionOrderStatusEnum, productionItemStatusEnum, shiftTypeEnum } from "./enums"

export const productionOrders = pgTable("production_orders", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => users.id),
  date:      date("date").notNull(),
  shift:     shiftTypeEnum("shift").notNull().default("night"),
  status:    productionOrderStatusEnum("status").notNull().default("draft"),
  notes:     text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productionOrderItems = pgTable("production_order_items", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  tenantId:           uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productionOrderId:  uuid("production_order_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  recipeId:           uuid("recipe_id").notNull().references(() => recipes.id),
  productId:          uuid("product_id").notNull().references(() => products.id),
  quantityPlanned:    numeric("quantity_planned", { precision: 12, scale: 3 }).notNull(),
  quantityProduced:   numeric("quantity_produced", { precision: 12, scale: 3 }).notNull().default("0"),
  wasteQuantity:      numeric("waste_quantity", { precision: 12, scale: 3 }).notNull().default("0"),
  status:             productionItemStatusEnum("status").notNull().default("pending"),
  startedAt:          timestamp("started_at", { withTimezone: true }),
  completedAt:        timestamp("completed_at", { withTimezone: true }),
})

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  tenant:    one(tenants, { fields: [productionOrders.tenantId], references: [tenants.id] }),
  createdBy: one(users, { fields: [productionOrders.createdBy], references: [users.id] }),
  items:     many(productionOrderItems),
}))

export const productionOrderItemsRelations = relations(productionOrderItems, ({ one }) => ({
  productionOrder: one(productionOrders, { fields: [productionOrderItems.productionOrderId], references: [productionOrders.id] }),
  recipe:          one(recipes, { fields: [productionOrderItems.recipeId], references: [recipes.id] }),
  product:         one(products, { fields: [productionOrderItems.productId], references: [products.id] }),
}))

export type ProductionOrder = typeof productionOrders.$inferSelect
export type ProductionOrderItem = typeof productionOrderItems.$inferSelect
export type NewProductionOrder = typeof productionOrders.$inferInsert
