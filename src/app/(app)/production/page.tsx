import { requireRole } from "@/lib/auth/server"
import { getProductionOrders } from "@/lib/queries/production"
import { getTenantId } from "@/lib/auth/server"
import Link from "next/link"
import { Plus, ChefHat } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const STATUS_LABELS = {
  draft:       { label: "Borrador",     color: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "En proceso",   color: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completada",   color: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelada",    color: "bg-red-100 text-red-600" },
}

const SHIFT_LABELS = {
  night:   "Nocturno",
  morning: "Mañana",
  afternoon: "Tarde",
}

export default async function ProductionPage() {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const orders = await getProductionOrders(tenantId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Órdenes de Producción</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{orders.length} órdenes registradas</p>
        </div>
        <Link
          href="/production/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <ChefHat className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay órdenes de producción</p>
          <p className="text-zinc-400 text-sm mt-1">Creá la primera orden del turno</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Turno</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Productos</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Creada por</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map(order => {
                const st = STATUS_LABELS[order.status]
                return (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {format(new Date(order.date), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {SHIFT_LABELS[order.shift]}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {order.createdBy?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/production/${order.id}`}
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
