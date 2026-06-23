import { db } from "@/db"
import { deliveryRoutes } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function getDeliveryRoutes(tenantId: string) {
  return db.query.deliveryRoutes.findMany({
    where: eq(deliveryRoutes.tenantId, tenantId),
    with: {
      assignedTo: { columns: { name: true } },
      stops:      true,
    },
    orderBy: [desc(deliveryRoutes.date), desc(deliveryRoutes.createdAt)],
    limit: 50,
  })
}

export async function getDeliveryRouteById(id: string, tenantId: string) {
  return db.query.deliveryRoutes.findFirst({
    where: and(eq(deliveryRoutes.id, id), eq(deliveryRoutes.tenantId, tenantId)),
    with: {
      assignedTo: { columns: { name: true } },
      stops: {
        with: {
          order: {
            with: { client: { columns: { name: true, address: true, phone: true } } },
          },
        },
        orderBy: (s, { asc }) => asc(s.stopSequence),
      },
    },
  })
}
