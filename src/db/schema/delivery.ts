import { pgTable, uuid, text, numeric, integer, date, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { users } from "./users"
import { orders } from "./orders"
import { clients } from "./clients"
import { deliveryRouteStatusEnum, deliveryStopStatusEnum, paymentMethodEnum } from "./enums"

export const deliveryRoutes = pgTable("delivery_routes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  tenantId:    uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  assignedTo:  text("assigned_to").notNull().references(() => users.id),
  createdBy:   text("created_by").notNull().references(() => users.id),
  date:        date("date").notNull(),
  status:      deliveryRouteStatusEnum("status").notNull().default("pending"),
  vehicleInfo: text("vehicle_info"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const deliveryRouteStops = pgTable("delivery_route_stops", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  routeId:         uuid("route_id").notNull().references(() => deliveryRoutes.id, { onDelete: "cascade" }),
  orderId:         uuid("order_id").notNull().references(() => orders.id),
  clientId:        uuid("client_id").notNull().references(() => clients.id),
  stopSequence:    integer("stop_sequence").notNull(),
  status:          deliveryStopStatusEnum("status").notNull().default("pending"),
  deliveredAt:     timestamp("delivered_at", { withTimezone: true }),
  collectedAmount: numeric("collected_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod:   paymentMethodEnum("payment_method"),
  notes:           text("notes"),
  signatureUrl:    text("signature_url"),
  photoUrl:        text("photo_url"),
  localId:         text("local_id"),       // ID generado offline en PWA
  syncedAt:        timestamp("synced_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const deliveryRoutesRelations = relations(deliveryRoutes, ({ one, many }) => ({
  tenant:     one(tenants, { fields: [deliveryRoutes.tenantId], references: [tenants.id] }),
  assignedTo: one(users, { fields: [deliveryRoutes.assignedTo], references: [users.id] }),
  stops:      many(deliveryRouteStops),
}))

export const deliveryStopsRelations = relations(deliveryRouteStops, ({ one }) => ({
  route:  one(deliveryRoutes, { fields: [deliveryRouteStops.routeId], references: [deliveryRoutes.id] }),
  order:  one(orders, { fields: [deliveryRouteStops.orderId], references: [orders.id] }),
  client: one(clients, { fields: [deliveryRouteStops.clientId], references: [clients.id] }),
}))

export type DeliveryRoute = typeof deliveryRoutes.$inferSelect
export type DeliveryRouteStop = typeof deliveryRouteStops.$inferSelect
export type NewDeliveryRoute = typeof deliveryRoutes.$inferInsert
