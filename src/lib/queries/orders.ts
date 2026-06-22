import { db } from "@/db"
import { orders, orderItems } from "@/db/schema"
import { eq, and, desc, gte, lte } from "drizzle-orm"

export async function getOrders(tenantId: string, date?: string) {
  const conditions = [eq(orders.tenantId, tenantId)]
  if (date) conditions.push(eq(orders.deliveryDate, date))

  return db.query.orders.findMany({
    where: and(...conditions),
    with: {
      client:    { columns: { name: true, phone: true, address: true } },
      createdBy: { columns: { name: true } },
      items:     { with: { product: { columns: { name: true } } } },
    },
    orderBy: desc(orders.createdAt),
  })
}

export async function getOrderById(id: string, tenantId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
    with: {
      client:    true,
      createdBy: { columns: { name: true } },
      items:     { with: { product: { with: { unit: true } } } },
    },
  })
}
