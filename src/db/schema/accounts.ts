import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { users } from "./users"
import { accountEntityTypeEnum, accountTransactionTypeEnum } from "./enums"

export const accountTransactions = pgTable("account_transactions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  entityType:      accountEntityTypeEnum("entity_type").notNull(),
  entityId:        uuid("entity_id").notNull(),
  transactionType: accountTransactionTypeEnum("transaction_type").notNull(),
  amount:          numeric("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter:    numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  referenceId:     uuid("reference_id"),
  referenceType:   text("reference_type"),
  description:     text("description"),
  createdBy:       text("created_by").references(() => users.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const accountTransactionsRelations = relations(accountTransactions, ({ one }) => ({
  tenant:    one(tenants, { fields: [accountTransactions.tenantId], references: [tenants.id] }),
  createdBy: one(users, { fields: [accountTransactions.createdBy], references: [users.id] }),
}))

export type AccountTransaction = typeof accountTransactions.$inferSelect
export type NewAccountTransaction = typeof accountTransactions.$inferInsert
