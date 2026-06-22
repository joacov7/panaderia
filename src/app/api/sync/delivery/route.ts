import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { db } from "@/db"
import {
  deliveryRouteStops, orders, clients,
  accountTransactions, stockMovements, products,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const stopSchema = z.object({
  localId:         z.string(),
  stopId:          z.string().uuid(),
  routeId:         z.string().uuid(),
  status:          z.enum(["delivered", "partial", "failed"]),
  collectedAmount: z.number().min(0),
  paymentMethod:   z.enum(["cash", "card", "transfer", "account"]).optional(),
  notes:           z.string().optional(),
  signatureUrl:    z.string().optional(),
  photoUrl:        z.string().optional(),
})

const bodySchema = z.object({
  stops: z.array(stopSchema),
})

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await request.json()
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const synced: string[] = []

  for (const stop of parsed.data.stops) {
    try {
      // Verificar que la parada pertenece al tenant y al repartidor
      const existing = await db.query.deliveryRouteStops.findFirst({
        where: and(
          eq(deliveryRouteStops.id, stop.stopId),
          eq(deliveryRouteStops.tenantId, tenantId)
        ),
        with: { route: true, order: { with: { items: true } }, client: true },
      })

      if (!existing || existing.syncedAt) {
        synced.push(stop.localId) // ya sincronizado o no existe, descartamos
        continue
      }

      // Actualizar parada
      await db
        .update(deliveryRouteStops)
        .set({
          status:          stop.status,
          deliveredAt:     new Date(),
          collectedAmount: String(stop.collectedAmount),
          paymentMethod:   stop.paymentMethod,
          notes:           stop.notes,
          signatureUrl:    stop.signatureUrl,
          photoUrl:        stop.photoUrl,
          localId:         stop.localId,
          syncedAt:        new Date(),
        })
        .where(eq(deliveryRouteStops.id, stop.stopId))

      // Si cobró en ruta y el pedido era en cuenta corriente, registrar pago
      if (stop.collectedAmount > 0 && existing.client) {
        const [clientRow] = await db
          .select({ currentBalance: clients.currentBalance })
          .from(clients)
          .where(eq(clients.id, existing.clientId))

        const newBalance = Number(clientRow.currentBalance) - stop.collectedAmount

        await db
          .update(clients)
          .set({ currentBalance: String(newBalance) })
          .where(eq(clients.id, existing.clientId))

        await db.insert(accountTransactions).values({
          tenantId,
          entityType:      "client",
          entityId:        existing.clientId,
          transactionType: "payment",
          amount:          String(-stop.collectedAmount),
          balanceAfter:    String(newBalance),
          referenceId:     stop.stopId,
          referenceType:   "delivery_stop",
          description:     `Cobro en ruta por ${session.user.name}`,
          createdBy:       session.user.id,
        })
      }

      // Si hubo entrega parcial o fallida, devolver stock PT
      if (stop.status === "failed" && existing.order?.items) {
        for (const item of existing.order.items) {
          const [product] = await db
            .select({ stockCurrent: products.stockCurrent })
            .from(products)
            .where(eq(products.id, item.productId))

          const returned = Number(item.quantityOrdered)
          const newStock = Number(product.stockCurrent) + returned

          await db
            .update(products)
            .set({ stockCurrent: String(newStock) })
            .where(eq(products.id, item.productId))

          await db.insert(stockMovements).values({
            tenantId,
            entityType:    "finished_product",
            entityId:      item.productId,
            movementType:  "delivery_return",
            quantity:      String(returned),
            stockAfter:    String(newStock),
            referenceId:   stop.stopId,
            referenceType: "delivery_stop",
            createdBy:     session.user.id,
          })
        }
      }

      // Actualizar estado del pedido
      const orderStatus = stop.status === "delivered" ? "delivered"
                        : stop.status === "partial"   ? "dispatched"
                        : "pending"

      await db
        .update(orders)
        .set({ status: orderStatus })
        .where(eq(orders.id, existing.orderId))

      synced.push(stop.localId)
    } catch (err) {
      console.error(`Error syncing stop ${stop.stopId}:`, err)
      // No agregamos a synced → el cliente reintentará
    }
  }

  return NextResponse.json({ synced })
}
