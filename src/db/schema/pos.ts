import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { users } from "./users"
import { clients } from "./clients"
import { products } from "./stock"
import { cashSessionStatusEnum, saleStatusEnum, paymentMethodEnum } from "./enums"

export const cashRegisters = pgTable("cash_registers", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  isActive:  boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const cashSessions = pgTable("cash_sessions", {
  id:                     uuid("id").primaryKey().defaultRandom(),
  tenantId:               uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  registerId:             uuid("register_id").notNull().references(() => cashRegisters.id),
  openedBy:               text("opened_by").notNull().references(() => users.id),
  closedBy:               text("closed_by").references(() => users.id),
  openedAt:               timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt:               timestamp("closed_at", { withTimezone: true }),
  openingAmount:          numeric("opening_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  closingAmountDeclared:  numeric("closing_amount_declared", { precision: 12, scale: 2 }),
  closingAmountSystem:    numeric("closing_amount_system", { precision: 12, scale: 2 }),
  status:                 cashSessionStatusEnum("status").notNull().default("open"),
})

export const sales = pgTable("sales", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  sessionId:      uuid("session_id").notNull().references(() => cashSessions.id),
  clientId:       uuid("client_id").references(() => clients.id),
  sellerId:       text("seller_id").notNull().references(() => users.id),
  saleDate:       timestamp("sale_date", { withTimezone: true }).notNull().defaultNow(),
  totalAmount:    numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod:  paymentMethodEnum("payment_method").notNull().default("cash"),
  status:         saleStatusEnum("status").notNull().default("completed"),
  receiptNumber:  text("receipt_number"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const saleItems = pgTable("sale_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  saleId:    uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity:  numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount:  numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  subtotal:  numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
})

export const salesRelations = relations(sales, ({ one, many }) => ({
  tenant:  one(tenants, { fields: [sales.tenantId], references: [tenants.id] }),
  session: one(cashSessions, { fields: [sales.sessionId], references: [cashSessions.id] }),
  client:  one(clients, { fields: [sales.clientId], references: [clients.id] }),
  seller:  one(users, { fields: [sales.sellerId], references: [users.id] }),
  items:   many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale:    one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}))

export type CashSession = typeof cashSessions.$inferSelect
export type Sale = typeof sales.$inferSelect
export type SaleItem = typeof saleItems.$inferSelect
export type NewSale = typeof sales.$inferInsert
