"use server"

import { db } from "@/db"
import { orders, orderItems, products } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const orderSchema = z.object({
  clientId:     z.string().uuid().optional(),
  deliveryDate: z.string().min(1),
  type:         z.enum(["delivery", "pos", "wholesale"]).default("delivery"),
  notes:        z.string().optional(),
  items: z.array(z.object({
    productId:       z.string().uuid(),
    quantityOrdered: z.number().positive(),
    unitPrice:       z.number().min(0),
  })).min(1),
})

export async function createOrder(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = session.user.tenantId
  const data = orderSchema.parse(input)

  const subtotals    = data.items.map(i => i.quantityOrdered * i.unitPrice)
  const totalAmount  = subtotals.reduce((a, b) => a + b, 0)

  const [order] = await db
    .insert(orders)
    .values({
      tenantId,
      clientId:     data.clientId,
      createdBy:    session.user.id,
      deliveryDate: data.deliveryDate,
      type:         data.type,
      notes:        data.notes,
      totalAmount:  String(totalAmount),
      status:       "pending",
    })
    .returning()

  await db.insert(orderItems).values(
    data.items.map((item, i) => ({
      tenantId,
      orderId:         order.id,
      productId:       item.productId,
      quantityOrdered: String(item.quantityOrdered),
      unitPrice:       String(item.unitPrice),
      subtotal:        String(subtotals[i]),
    }))
  )

  revalidatePath("/orders")
  return order
}

export async function updateOrderStatus(
  id: string,
  status: "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled"
) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier"])
  await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, id), eq(orders.tenantId, session.user.tenantId)))
  revalidatePath("/orders")
}
