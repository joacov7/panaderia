"use server"

import { db } from "@/db"
import {
  cashSessions, sales, saleItems, products,
  stockMovements, accountTransactions, clients,
} from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const openSessionSchema = z.object({
  registerId:    z.string().uuid(),
  openingAmount: z.number().min(0),
})

export async function openCashSession(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier"])
  const data = openSessionSchema.parse(input)

  const existing = await db.query.cashSessions.findFirst({
    where: and(
      eq(cashSessions.tenantId, session.user.tenantId),
      eq(cashSessions.openedBy, session.user.id),
      eq(cashSessions.status, "open")
    ),
  })
  if (existing) throw new Error("Ya tenés una caja abierta")

  const [newSession] = await db
    .insert(cashSessions)
    .values({
      tenantId:      session.user.tenantId,
      registerId:    data.registerId,
      openedBy:      session.user.id,
      openingAmount: String(data.openingAmount),
      status:        "open",
    })
    .returning()

  revalidatePath("/pos")
  return newSession
}

export async function closeCashSession(sessionId: string, declaredAmount: number) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier"])

  const { getSessionTotals } = await import("@/lib/queries/pos")
  const totals = await getSessionTotals(sessionId)

  await db
    .update(cashSessions)
    .set({
      closedBy:               session.user.id,
      closedAt:               new Date(),
      closingAmountDeclared:  String(declaredAmount),
      closingAmountSystem:    String(totals.total),
      status:                 "closed",
    })
    .where(and(
      eq(cashSessions.id, sessionId),
      eq(cashSessions.tenantId, session.user.tenantId)
    ))

  revalidatePath("/pos")
  return totals
}

const saleSchema = z.object({
  sessionId:     z.string().uuid(),
  clientId:      z.string().uuid().optional(),
  paymentMethod: z.enum(["cash", "card", "transfer", "account"]),
  discount:      z.number().min(0).default(0),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity:  z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
})

export async function registerSale(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = session.user.tenantId
  const data = saleSchema.parse(input)

  const subtotals = data.items.map(i => i.quantity * i.unitPrice)
  const totalBeforeDiscount = subtotals.reduce((a, b) => a + b, 0)
  const totalAmount = Math.max(0, totalBeforeDiscount - data.discount)

  // Crear venta
  const [sale] = await db
    .insert(sales)
    .values({
      tenantId,
      sessionId:     data.sessionId,
      clientId:      data.clientId,
      sellerId:      session.user.id,
      paymentMethod: data.paymentMethod,
      totalAmount:   String(totalAmount),
      discountAmount: String(data.discount),
      status:        "completed",
    })
    .returning()

  // Insertar ítems y descontar stock
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i]

    await db.insert(saleItems).values({
      tenantId,
      saleId:    sale.id,
      productId: item.productId,
      quantity:  String(item.quantity),
      unitPrice: String(item.unitPrice),
      discount:  "0",
      subtotal:  String(subtotals[i]),
    })

    // Descontar stock PT
    const [product] = await db
      .select({ stockCurrent: products.stockCurrent })
      .from(products)
      .where(eq(products.id, item.productId))

    const newStock = Math.max(0, Number(product.stockCurrent) - item.quantity)

    await db
      .update(products)
      .set({ stockCurrent: String(newStock) })
      .where(eq(products.id, item.productId))

    await db.insert(stockMovements).values({
      tenantId,
      entityType:    "finished_product",
      entityId:      item.productId,
      movementType:  "sale",
      quantity:      String(-item.quantity),
      stockAfter:    String(newStock),
      referenceId:   sale.id,
      referenceType: "sale",
      createdBy:     session.user.id,
    })
  }

  // Si paga con cuenta corriente, registrar deuda
  if (data.paymentMethod === "account" && data.clientId) {
    const [client] = await db
      .select({ currentBalance: clients.currentBalance })
      .from(clients)
      .where(eq(clients.id, data.clientId))

    const newBalance = Number(client.currentBalance) + totalAmount

    await db
      .update(clients)
      .set({ currentBalance: String(newBalance) })
      .where(eq(clients.id, data.clientId))

    await db.insert(accountTransactions).values({
      tenantId,
      entityType:      "client",
      entityId:        data.clientId,
      transactionType: "invoice",
      amount:          String(totalAmount),
      balanceAfter:    String(newBalance),
      referenceId:     sale.id,
      referenceType:   "sale",
      description:     "Venta en caja",
      createdBy:       session.user.id,
    })
  }

  revalidatePath("/pos")
  return sale
}
