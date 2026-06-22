import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { suppliers } from "./clients"
import { users } from "./users"
import { rawMaterials } from "./stock"
import { purchaseOrderStatusEnum } from "./enums"

export const purchaseOrders = pgTable("purchase_orders", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  supplierId:   uuid("supplier_id").notNull().references(() => suppliers.id),
  createdBy:    text("created_by").notNull().references(() => users.id),
  orderDate:    date("order_date").notNull().defaultNow(),
  expectedDate: date("expected_date"),
  status:       purchaseOrderStatusEnum("status").notNull().default("draft"),
  totalAmount:  numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  purchaseOrderId:  uuid("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  rawMaterialId:    uuid("raw_material_id").notNull().references(() => rawMaterials.id),
  quantityOrdered:  numeric("quantity_ordered", { precision: 12, scale: 3 }).notNull(),
  quantityReceived: numeric("quantity_received", { precision: 12, scale: 3 }).notNull().default("0"),
  unitCost:         numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
  subtotal:         numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
})

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant:    one(tenants, { fields: [purchaseOrders.tenantId], references: [tenants.id] }),
  supplier:  one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  createdBy: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
  items:     many(purchaseOrderItems),
}))

export type PurchaseOrder = typeof purchaseOrders.$inferSelect
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert
