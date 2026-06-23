import { requireRole, getTenantId } from "@/lib/auth/server"
import { getOrderById } from "@/lib/queries/orders"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderStatusActions } from "@/components/orders/order-status-actions"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = await getTenantId()
  const { id } = await params
  const order = await getOrderById(id, tenantId)

  if (!order) notFound()

  const typeLabel = { delivery: "Reparto", pos: "Mostrador", wholesale: "Mayorista" }[order.type] ?? order.type

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-zinc-900">
              {order.client?.name ?? "Pedido sin cliente"}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {typeLabel} · Entrega: {format(new Date(order.deliveryDate), "dd 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Productos</h3>
        </div>
        <div className="divide-y divide-zinc-100">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">{item.product?.name ?? "Producto eliminado"}</p>
                <p className="text-xs text-zinc-400">
                  {Number(item.quantityOrdered)} × {formatCurrency(Number(item.unitPrice))}
                </p>
              </div>
              <p className="text-sm font-semibold text-zinc-800">{formatCurrency(Number(item.subtotal))}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-zinc-50 flex justify-between items-center">
          <p className="text-sm font-medium text-zinc-600">Total</p>
          <p className="text-base font-bold text-zinc-900">{formatCurrency(Number(order.totalAmount))}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-1">Cliente</p>
          <p className="text-zinc-800">{order.client?.name ?? "—"}</p>
          {order.client?.phone && <p className="text-zinc-400 text-xs">{order.client.phone}</p>}
          {order.client?.address && <p className="text-zinc-400 text-xs">{order.client.address}</p>}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-1">Registrado por</p>
          <p className="text-zinc-800">{order.createdBy?.name ?? "—"}</p>
        </div>
        {order.notes && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-zinc-400 mb-1">Notas</p>
            <p className="text-zinc-800">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
