import { db } from "@/db"
import { suppliers } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function getSuppliers(tenantId: string) {
  return db.query.suppliers.findMany({
    where: and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)),
    orderBy: suppliers.name,
  })
}

export async function getSupplierById(id: string, tenantId: string) {
  return db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)),
  })
}
