import { db } from "@/db"
import { cashSessions, cashRegisters, sales, saleItems, products } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

export async function getOpenSession(tenantId: string, userId: string) {
  return db.query.cashSessions.findFirst({
    where: and(
      eq(cashSessions.tenantId, tenantId),
      eq(cashSessions.status, "open"),
      eq(cashSessions.openedBy, userId)
    ),
    with: { register: true },
  })
}

export async function getActiveProducts(tenantId: string) {
  return db.query.products.findMany({
    where: and(eq(products.tenantId, tenantId), eq(products.isActive, true)),
    with: { category: true, unit: true },
    orderBy: products.name,
  })
}

export async function getRegisters(tenantId: string) {
  return db.query.cashRegisters.findMany({
    where: and(eq(cashRegisters.tenantId, tenantId), eq(cashRegisters.isActive, true)),
  })
}

export async function getSessionSales(sessionId: string) {
  return db.query.sales.findMany({
    where: eq(sales.sessionId, sessionId),
    with: { items: { with: { product: { columns: { name: true } } } }, client: { columns: { name: true } } },
    orderBy: desc(sales.saleDate),
  })
}

export async function getCashSessions(tenantId: string, limit = 30) {
  return db.query.cashSessions.findMany({
    where: eq(cashSessions.tenantId, tenantId),
    with: {
      register:  { columns: { name: true } },
      openedBy:  { columns: { name: true } },
    },
    orderBy: desc(cashSessions.openedAt),
    limit,
  })
}

export async function getSessionTotals(sessionId: string) {
  const result = await db
    .select({
      total:       sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      totalCash:   sql<number>`COALESCE(SUM(CASE WHEN ${sales.paymentMethod} = 'cash' THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      totalCard:   sql<number>`COALESCE(SUM(CASE WHEN ${sales.paymentMethod} = 'card' THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      totalTransfer: sql<number>`COALESCE(SUM(CASE WHEN ${sales.paymentMethod} = 'transfer' THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      totalAccount: sql<number>`COALESCE(SUM(CASE WHEN ${sales.paymentMethod} = 'account' THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      count:       sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(and(eq(sales.sessionId, sessionId), eq(sales.status, "completed")))

  return result[0]
}
