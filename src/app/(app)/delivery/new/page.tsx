import { requireRole, getTenantId } from "@/lib/auth/server"
import { getTenantUsers } from "@/lib/queries/settings"
import { getOrders } from "@/lib/queries/orders"
import { NewDeliveryRouteForm } from "@/components/delivery/new-delivery-route-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewDeliveryRoutePage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()

  const today = new Date().toISOString().split("T")[0]

  const [allUsers, pendingOrders] = await Promise.all([
    getTenantUsers(tenantId),
    getOrders(tenantId, today),
  ])

  const drivers = allUsers.filter(u => u.role === "delivery" && u.isActive)
  const eligible = pendingOrders.filter(o =>
    o.type === "delivery" && ["confirmed", "ready"].includes(o.status)
  )

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/delivery" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nueva Ruta de Reparto</h2>
      </div>

      <NewDeliveryRouteForm drivers={drivers} orders={eligible} defaultDate={today} />
    </div>
  )
}
