"use server"

import { db } from "@/db"
import { productionOrders, productionOrderItems, products, rawMaterials, stockMovements } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createOrderSchema = z.object({
  date:  z.string().min(1),
  shift: z.enum(["night", "morning", "afternoon"]),
  notes: z.string().optional(),
  items: z.array(z.object({
    recipeId:        z.string().uuid(),
    productId:       z.string().uuid(),
    quantityPlanned: z.number().positive(),
  })).min(1),
})

export async function createProductionOrder(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "production"])
  const data = createOrderSchema.parse(input)

  const [order] = await db
    .insert(productionOrders)
    .values({
      tenantId:  session.user.tenantId,
      createdBy: session.user.id,
      date:      data.date,
      shift:     data.shift,
      notes:     data.notes,
      status:    "draft",
    })
    .returning()

  if (data.items.length > 0) {
    await db.insert(productionOrderItems).values(
      data.items.map(item => ({
        tenantId:          session.user.tenantId,
        productionOrderId: order.id,
        recipeId:          item.recipeId,
        productId:         item.productId,
        quantityPlanned:   String(item.quantityPlanned),
      }))
    )
  }

  revalidatePath("/production")
  return order
}

export async function updateProductionItemStatus(
  itemId: string,
  status: "in_progress" | "done",
  quantityProduced?: number,
  wasteQuantity?: number,
) {
  const session = await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = session.user.tenantId

  const [item] = await db
    .select()
    .from(productionOrderItems)
    .where(and(
      eq(productionOrderItems.id, itemId),
      eq(productionOrderItems.tenantId, tenantId)
    ))

  if (!item) throw new Error("Item no encontrado")

  const updates: Record<string, unknown> = { status }
  if (status === "in_progress") updates.startedAt = new Date()
  if (status === "done") {
    updates.completedAt = new Date()
    if (quantityProduced !== undefined) updates.quantityProduced = String(quantityProduced)
    if (wasteQuantity !== undefined) updates.wasteQuantity = String(wasteQuantity)
  }

  await db
    .update(productionOrderItems)
    .set(updates as Parameters<typeof db.update>[0] extends never ? never : Record<string, unknown>)
    .where(eq(productionOrderItems.id, itemId))

  // Si se completó, actualizar stock (lógica simplificada — en producción usar DB trigger)
  if (status === "done" && quantityProduced) {
    const [product] = await db
      .select({ stockCurrent: products.stockCurrent })
      .from(products)
      .where(eq(products.id, item.productId))

    const newStock = Number(product.stockCurrent) + quantityProduced

    await db
      .update(products)
      .set({ stockCurrent: String(newStock) })
      .where(eq(products.id, item.productId))

    await db.insert(stockMovements).values({
      tenantId,
      entityType:    "finished_product",
      entityId:      item.productId,
      movementType:  "production_in",
      quantity:      String(quantityProduced),
      stockAfter:    String(newStock),
      referenceId:   item.productionOrderId,
      referenceType: "production_order",
      createdBy:     session.user.id,
    })
  }

  revalidatePath("/production")
}
