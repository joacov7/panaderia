import { db } from "@/db"
import { purchaseOrders } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function getPurchaseOrders(tenantId: string) {
  return db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.tenantId, tenantId),
    with: {
      supplier:  { columns: { name: true } },
      createdBy: { columns: { name: true } },
      items:     { with: { rawMaterial: { columns: { name: true } }, } },
    },
    orderBy: desc(purchaseOrders.createdAt),
  })
}

export async function getPurchaseOrderById(id: string, tenantId: string) {
  return db.query.purchaseOrders.findFirst({
    where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
    with: {
      supplier:  true,
      createdBy: { columns: { name: true } },
      items: {
        with: {
          rawMaterial: { with: { unit: true } },
        },
      },
    },
  })
}
