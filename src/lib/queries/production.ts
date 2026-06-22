import { db } from "@/db"
import { productionOrders, productionOrderItems, products, recipes } from "@/db/schema"
import { eq, and, desc, gte, lte } from "drizzle-orm"

export async function getProductionOrders(tenantId: string, date?: string) {
  const conditions = [eq(productionOrders.tenantId, tenantId)]
  if (date) conditions.push(eq(productionOrders.date, date))

  return db.query.productionOrders.findMany({
    where: and(...conditions),
    with: {
      createdBy: { columns: { name: true } },
      items: {
        with: {
          product: { columns: { name: true } },
          recipe:  { columns: { name: true } },
        },
      },
    },
    orderBy: desc(productionOrders.createdAt),
  })
}

export async function getProductionOrderById(id: string, tenantId: string) {
  return db.query.productionOrders.findFirst({
    where: and(
      eq(productionOrders.id, id),
      eq(productionOrders.tenantId, tenantId)
    ),
    with: {
      createdBy: { columns: { name: true } },
      items: {
        with: {
          product: true,
          recipe: { with: { items: { with: { rawMaterial: true, unit: true } } } },
        },
      },
    },
  })
}
