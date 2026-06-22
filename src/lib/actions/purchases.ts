"use server"

import { db } from "@/db"
import {
  purchaseOrders, purchaseOrderItems,
  rawMaterials, stockMovements,
  suppliers, accountTransactions,
} from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const purchaseSchema = z.object({
  supplierId:   z.string().uuid(),
  expectedDate: z.string().optional(),
  notes:        z.string().optional(),
  items: z.array(z.object({
    rawMaterialId:   z.string().uuid(),
    quantityOrdered: z.number().positive(),
    unitCost:        z.number().positive(),
  })).min(1),
})

export async function createPurchaseOrder(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = purchaseSchema.parse(input)

  const total = data.items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0)

  const [order] = await db
    .insert(purchaseOrders)
    .values({
      tenantId,
      supplierId:   data.supplierId,
      createdBy:    session.user.id,
      expectedDate: data.expectedDate,
      notes:        data.notes,
      totalAmount:  String(total),
      status:       "draft",
    })
    .returning()

  await db.insert(purchaseOrderItems).values(
    data.items.map(item => ({
      tenantId,
      purchaseOrderId:  order.id,
      rawMaterialId:    item.rawMaterialId,
      quantityOrdered:  String(item.quantityOrdered),
      quantityReceived: "0",
      unitCost:         String(item.unitCost),
      subtotal:         String(item.quantityOrdered * item.unitCost),
    }))
  )

  revalidatePath("/purchases")
  return order
}

const receiveSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  items: z.array(z.object({
    itemId:           z.string().uuid(),
    rawMaterialId:    z.string().uuid(),
    quantityReceived: z.number().min(0),
    unitCost:         z.number().positive(),
  })),
})

export async function receivePurchaseOrder(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = receiveSchema.parse(input)

  let allReceived = true

  for (const item of data.items) {
    if (item.quantityReceived <= 0) { allReceived = false; continue }

    // Actualizar cantidad recibida en el ítem
    const [updated] = await db
      .update(purchaseOrderItems)
      .set({
        quantityReceived: String(item.quantityReceived),
        unitCost:         String(item.unitCost),
      })
      .where(and(
        eq(purchaseOrderItems.id, item.itemId),
        eq(purchaseOrderItems.tenantId, tenantId)
      ))
      .returning()

    if (Number(updated.quantityReceived) < Number(updated.quantityOrdered)) allReceived = false

    // Incrementar stock MP
    const [mp] = await db
      .select({ stockCurrent: rawMaterials.stockCurrent })
      .from(rawMaterials)
      .where(eq(rawMaterials.id, item.rawMaterialId))

    const newStock = Number(mp.stockCurrent) + item.quantityReceived

    await db
      .update(rawMaterials)
      .set({ stockCurrent: String(newStock), costPerUnit: String(item.unitCost) })
      .where(eq(rawMaterials.id, item.rawMaterialId))

    await db.insert(stockMovements).values({
      tenantId,
      entityType:    "raw_material",
      entityId:      item.rawMaterialId,
      movementType:  "purchase",
      quantity:      String(item.quantityReceived),
      stockAfter:    String(newStock),
      unitCost:      String(item.unitCost),
      referenceId:   data.purchaseOrderId,
      referenceType: "purchase_order",
      createdBy:     session.user.id,
    })
  }

  // Calcular total recibido para CC proveedor
  const total = data.items.reduce((s, i) => s + i.quantityReceived * i.unitCost, 0)
  const newStatus = allReceived ? "received" : "partial"

  const [order] = await db
    .update(purchaseOrders)
    .set({ status: newStatus })
    .where(and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)))
    .returning()

  // Registrar deuda con proveedor
  if (total > 0) {
    const [supplier] = await db
      .select({ currentBalance: suppliers.currentBalance })
      .from(suppliers)
      .where(eq(suppliers.id, order.supplierId))

    const newBalance = Number(supplier.currentBalance) + total

    await db
      .update(suppliers)
      .set({ currentBalance: String(newBalance) })
      .where(eq(suppliers.id, order.supplierId))

    await db.insert(accountTransactions).values({
      tenantId,
      entityType:      "supplier",
      entityId:        order.supplierId,
      transactionType: "invoice",
      amount:          String(total),
      balanceAfter:    String(newBalance),
      referenceId:     data.purchaseOrderId,
      referenceType:   "purchase_order",
      description:     "Recepción de mercadería",
      createdBy:       session.user.id,
    })
  }

  revalidatePath("/purchases")
  return order
}
