import { db } from "@/db"
import { clients, accountTransactions } from "@/db/schema"
import { eq, and, desc, sql, ilike, or } from "drizzle-orm"

export async function getClients(tenantId: string, search?: string) {
  const conditions = [eq(clients.tenantId, tenantId), eq(clients.isActive, true)]

  if (search) {
    conditions.push(
      or(
        ilike(clients.name, `%${search}%`),
        ilike(clients.phone, `%${search}%`),
        ilike(clients.taxId, `%${search}%`)
      )!
    )
  }

  return db.query.clients.findMany({
    where: and(...conditions),
    orderBy: clients.name,
  })
}

export async function getClientById(id: string, tenantId: string) {
  return db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.tenantId, tenantId)),
  })
}

export async function getClientAccountMovements(clientId: string, tenantId: string) {
  return db.query.accountTransactions.findMany({
    where: and(
      eq(accountTransactions.tenantId, tenantId),
      eq(accountTransactions.entityType, "client"),
      eq(accountTransactions.entityId, clientId)
    ),
    orderBy: desc(accountTransactions.createdAt),
    with: { createdBy: { columns: { name: true } } },
  })
}

export async function getAccountSummary(tenantId: string) {
  const result = await db
    .select({
      totalDebt:   sql<number>`COALESCE(SUM(CASE WHEN ${clients.currentBalance} > 0 THEN ${clients.currentBalance} ELSE 0 END), 0)`,
      totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${clients.currentBalance} < 0 THEN ${clients.currentBalance} ELSE 0 END), 0)`,
      withDebt:    sql<number>`COUNT(CASE WHEN ${clients.currentBalance} > 0 THEN 1 END)`,
    })
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.isActive, true)))

  return result[0]
}
