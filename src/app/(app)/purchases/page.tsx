import { requireRole, getTenantId } from "@/lib/auth/server"
import { getPurchaseOrders } from "@/lib/queries/purchases"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Plus, ShoppingCart } from "lucide-react"

const STATUS_MAP = {
  draft:     { label: "Borrador",    color: "bg-zinc-100 text-zinc-600" },
  sent:      { label: "Enviada",     color: "bg-blue-100 text-blue-700" },
  partial:   { label: "Parcial",     color: "bg-amber-100 text-amber-700" },
  received:  { label: "Recibida",    color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada",   color: "bg-red-100 text-red-600" },
}

export default async function PurchasesPage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const orders = await getPurchaseOrders(tenantId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Compras</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{orders.length} órdenes registradas</p>
        </div>
        <Link
          href="/purchases/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva OC
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <ShoppingCart className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay órdenes de compra</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Proveedor</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Ítems</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Total</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map(order => {
                const st = STATUS_MAP[order.status]
                return (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-600">
                      {format(new Date(order.orderDate), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {order.supplier?.name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-zinc-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/purchases/${order.id}`}
                        className="text-zinc-500 hover:text-zinc-900 font-medium text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
