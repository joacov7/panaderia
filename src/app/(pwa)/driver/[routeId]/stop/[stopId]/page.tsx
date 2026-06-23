import { requireRole } from "@/lib/auth/server"
import { db } from "@/db"
import { deliveryRouteStops } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DeliveryStopForm } from "@/components/delivery/delivery-stop-form"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"

export default async function StopPage({
  params,
}: {
  params: Promise<{ routeId: string; stopId: string }>
}) {
  const session = await requireRole(["delivery", "admin", "owner"])
  const { routeId, stopId } = await params

  const stop = await db.query.deliveryRouteStops.findFirst({
    where: and(
      eq(deliveryRouteStops.id, stopId),
      eq(deliveryRouteStops.tenantId, session.user.tenantId)
    ),
    with: {
      client:  true,
      order:   { with: { items: { with: { product: { columns: { name: true, salePrice: true } } } } } },
    },
  })

  if (!stop) notFound()

  const alreadyDone = stop.status !== "pending"

  return (
    <div className="pb-10">
      <div className="px-4 py-3 bg-white border-b border-zinc-200 flex items-center gap-3 sticky top-14 z-10">
        <Link href={`/driver/${routeId}`} className="text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <p className="font-semibold text-zinc-800 text-sm truncate">{stop.client?.name}</p>
          {stop.client?.address && (
            <p className="text-xs text-zinc-400 truncate">{stop.client.address}</p>
          )}
        </div>
        {stop.client?.phone && (
          <a href={`tel:${stop.client.phone}`} className="text-blue-600 text-sm font-medium">
            Llamar
          </a>
        )}
      </div>

      {/* Items del pedido */}
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Pedido</p>
          </div>
          <ul className="divide-y divide-zinc-50">
            {stop.order?.items.map(item => (
              <li key={item.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{item.product?.name}</p>
                  <p className="text-xs text-zinc-400">{formatCurrency(item.product?.salePrice ?? 0)} c/u</p>
                </div>
                <span className="text-xl font-bold text-zinc-900">{Number(item.quantityOrdered)}</span>
              </li>
            ))}
          </ul>
        </div>

        {alreadyDone ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="font-semibold text-zinc-700">Parada completada</p>
            <p className="text-sm text-zinc-400">
              Estado: {stop.status} · Cobrado: {formatCurrency(stop.collectedAmount)}
            </p>
          </div>
        ) : (
          <DeliveryStopForm
            stopId={stop.id}
            routeId={routeId}
            orderTotal={stop.order?.items.reduce(
              (sum, i) => sum + Number(i.quantityOrdered) * Number(i.product?.salePrice ?? 0), 0
            ) ?? 0}
          />
        )}
      </div>
    </div>
  )
}
