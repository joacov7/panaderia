import { pgEnum } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "admin", "owner", "supervisor", "production", "delivery", "cashier", "seller",
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "in_production", "ready", "dispatched", "delivered", "cancelled",
])

export const productionOrderStatusEnum = pgEnum("production_order_status", [
  "draft", "in_progress", "completed", "cancelled",
])

export const productionItemStatusEnum = pgEnum("production_item_status", [
  "pending", "in_progress", "done", "failed",
])

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "draft", "sent", "partial", "received", "cancelled",
])

export const deliveryRouteStatusEnum = pgEnum("delivery_route_status", [
  "pending", "in_progress", "completed", "cancelled",
])

export const deliveryStopStatusEnum = pgEnum("delivery_stop_status", [
  "pending", "delivered", "partial", "failed",
])

export const cashSessionStatusEnum = pgEnum("cash_session_status", [
  "open", "closed",
])

export const saleStatusEnum = pgEnum("sale_status", [
  "completed", "cancelled", "refunded",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash", "card", "transfer", "account",
])

export const stockEntityTypeEnum = pgEnum("stock_entity_type", [
  "raw_material", "finished_product",
])

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "production_in", "production_out", "sale", "purchase",
  "adjustment", "delivery_return", "initial",
])

export const accountEntityTypeEnum = pgEnum("account_entity_type", [
  "client", "supplier",
])

export const accountTransactionTypeEnum = pgEnum("account_transaction_type", [
  "invoice", "payment", "credit_note", "debit_note",
])

export const orderTypeEnum = pgEnum("order_type", [
  "delivery", "pos", "wholesale",
])

export const clientTypeEnum = pgEnum("client_type", [
  "retail", "wholesale",
])

export const shiftTypeEnum = pgEnum("shift_type", [
  "night", "morning", "afternoon",
])

export const stockCategoryTypeEnum = pgEnum("stock_category_type", [
  "raw_material", "finished_product",
])

export const planTypeEnum = pgEnum("plan_type", [
  "trial", "starter", "pro", "enterprise",
])

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active", "suspended", "cancelled",
])
