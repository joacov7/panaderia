import { requireRole, getTenantId } from "@/lib/auth/server"
import { getDeliveryRoutes } from "@/lib/queries/delivery"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Plus, Truck } from "lucide-react"

const STATUS_MAP = {
  pending:     { label: "Pendiente",   color: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "En curso",   color: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-600" },
}

export default async function DeliveryPage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const routes = await getDeliveryRoutes(tenantId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Rutas de Reparto</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{routes.length} rutas registradas</p>
        </div>
        <Link href="/delivery/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors">
          <Plus className="w-4 h-4" /> Nueva ruta
        </Link>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <Truck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay rutas registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Repartidor</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Paradas</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Progreso</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {routes.map(route => {
                const st = STATUS_MAP[route.status] ?? STATUS_MAP.pending
                const done = route.stops.filter(s => s.status === "delivered").length
                const total = route.stops.length
                return (
                  <tr key={route.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-600">
                      {format(new Date(route.date), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {route.assignedTo?.name ?? "—"}
                      {route.vehicleInfo && (
                        <span className="block text-xs text-zinc-400">{route.vehicleInfo}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{total} paradas</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-zinc-100 rounded-full h-1.5">
                          <div className="bg-zinc-900 h-1.5 rounded-full"
                            style={{ width: total > 0 ? `${Math.round(done / total * 100)}%` : "0%" }} />
                        </div>
                        <span className="text-xs text-zinc-500">{done}/{total}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/delivery/${route.id}`}
                        className="text-zinc-500 hover:text-zinc-900 font-medium text-xs">
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
