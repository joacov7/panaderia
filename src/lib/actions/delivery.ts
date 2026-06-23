"use server"

import { db } from "@/db"
import { deliveryRoutes, deliveryRouteStops, orders } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createRouteSchema = z.object({
  date:        z.string().min(1),
  assignedTo:  z.string().min(1),
  vehicleInfo: z.string().optional(),
  notes:       z.string().optional(),
  orderIds:    z.array(z.string().uuid()).min(1),
})

export async function createDeliveryRoute(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = createRouteSchema.parse(input)

  const orderRows = await db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      inArray(orders.id, data.orderIds)
    ),
    columns: { id: true, clientId: true },
  })

  const clientMap = new Map(orderRows.map(o => [o.id, o.clientId]))

  const [route] = await db
    .insert(deliveryRoutes)
    .values({
      tenantId,
      date:        data.date,
      assignedTo:  data.assignedTo,
      createdBy:   session.user.id,
      vehicleInfo: data.vehicleInfo,
      notes:       data.notes,
      status:      "pending",
    })
    .returning()

  await db.insert(deliveryRouteStops).values(
    data.orderIds.map((orderId, i) => ({
      tenantId,
      routeId:      route.id,
      orderId,
      clientId:     clientMap.get(orderId) ?? "",
      stopSequence: i + 1,
      status:       "pending" as const,
      localId:      crypto.randomUUID(),
    }))
  )

  revalidatePath("/delivery")
  return route
}

export async function updateRouteStatus(
  routeId: string,
  status: "in_progress" | "completed" | "cancelled"
) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  await db
    .update(deliveryRoutes)
    .set({ status })
    .where(and(eq(deliveryRoutes.id, routeId), eq(deliveryRoutes.tenantId, session.user.tenantId)))
  revalidatePath("/delivery")
}
