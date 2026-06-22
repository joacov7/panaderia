import { requireRole, getTenantId } from "@/lib/auth/server"
import { getOrders } from "@/lib/queries/orders"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStatusActions } from "@/components/orders/order-status-actions"

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = await getTenantId()
  const { date } = await searchParams
  const ordersList = await getOrders(tenantId, date)

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Pedidos</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{ordersList.length} pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={date ?? today}
            onChange={e => {
              window.location.href = `/orders?date=${e.target.value}`
            }}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <Link
            href="/orders/new"
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                       text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo pedido
          </Link>
        </div>
      </div>

      {ordersList.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay pedidos para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ordersList.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-zinc-800">
                      {order.client?.name ?? "Cliente sin nombre"}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  {order.client?.address && (
                    <p className="text-xs text-zinc-400 mt-0.5">{order.client.address}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-zinc-500">
                      Entrega: {format(new Date(order.deliveryDate), "dd MMM", { locale: es })}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-sm font-semibold text-zinc-800">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  {/* Detalle de ítems */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {order.items.map(item => (
                      <span key={item.id} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                        {Number(item.quantityOrdered)} × {item.product?.name}
                      </span>
                    ))}
                  </div>
                </div>

                <OrderStatusActions orderId={order.id} currentStatus={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
