import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { clients } from "./clients"
import { products } from "./stock"
import { users } from "./users"
import { orderStatusEnum, orderTypeEnum } from "./enums"

export const orders = pgTable("orders", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  clientId:       uuid("client_id").references(() => clients.id),
  createdBy:      text("created_by").notNull().references(() => users.id),
  deliveryDate:   date("delivery_date").notNull(),
  type:           orderTypeEnum("type").notNull().default("delivery"),
  status:         orderStatusEnum("status").notNull().default("pending"),
  totalAmount:    numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable("order_items", {
  id:                uuid("id").primaryKey().defaultRandom(),
  tenantId:          uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId:           uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId:         uuid("product_id").notNull().references(() => products.id),
  quantityOrdered:   numeric("quantity_ordered", { precision: 12, scale: 3 }).notNull(),
  quantityDelivered: numeric("quantity_delivered", { precision: 12, scale: 3 }).notNull().default("0"),
  unitPrice:         numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal:          numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes:             text("notes"),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant:    one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  client:    one(clients, { fields: [orders.clientId], references: [clients.id] }),
  createdBy: one(users, { fields: [orders.createdBy], references: [users.id] }),
  items:     many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order:   one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}))

export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrder = typeof orders.$inferInsert
