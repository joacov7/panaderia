import { requireRole, getTenantId } from "@/lib/auth/server"
import { getDeliveryRouteById } from "@/lib/queries/delivery"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, XCircle, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/currency"
import { RouteStatusActions } from "@/components/delivery/route-status-actions"

const STOP_STATUS = {
  pending:   { icon: Clock,         color: "text-zinc-400",  label: "Pendiente" },
  delivered: { icon: CheckCircle,   color: "text-green-500", label: "Entregado" },
  failed:    { icon: XCircle,       color: "text-red-500",   label: "No entregado" },
  partial:   { icon: MapPin,        color: "text-amber-500", label: "Parcial" },
}

const ROUTE_STATUS = {
  pending:     { label: "Pendiente",   color: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "En curso",   color: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-600" },
}

export default async function DeliveryRouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const { id } = await params
  const route = await getDeliveryRouteById(id, tenantId)
  if (!route) notFound()

  const st = ROUTE_STATUS[route.status] ?? ROUTE_STATUS.pending
  const done  = route.stops.filter(s => s.status === "delivered").length
  const total = route.stops.length

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/delivery" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-zinc-900">
              Ruta — {format(new Date(route.date), "dd 'de' MMMM", { locale: es })}
            </h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {route.assignedTo?.name ?? "Sin asignar"} · {done}/{total} entregas
          </p>
        </div>
        <RouteStatusActions routeId={route.id} currentStatus={route.status} />
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-zinc-700">Progreso de entregas</p>
          <p className="text-sm font-bold text-zinc-900">
            {total > 0 ? Math.round(done / total * 100) : 0}%
          </p>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div className="bg-zinc-900 h-2 rounded-full transition-all"
            style={{ width: total > 0 ? `${Math.round(done / total * 100)}%` : "0%" }} />
        </div>
      </div>

      {/* Paradas */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Paradas</h3>
        </div>
        <div className="divide-y divide-zinc-100">
          {route.stops.map(stop => {
            const ss = STOP_STATUS[stop.status] ?? STOP_STATUS.pending
            const Icon = ss.icon
            const client = stop.order?.client
            return (
              <div key={stop.id} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5">
                  <Icon className={`w-4 h-4 ${ss.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-800 text-sm">
                    #{stop.stopSequence} · {client?.name ?? "Cliente sin nombre"}
                  </p>
                  {client?.address && (
                    <p className="text-xs text-zinc-400">{client.address}</p>
                  )}
                  {client?.phone && (
                    <p className="text-xs text-zinc-400">{client.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${ss.color}`}>{ss.label}</span>
                  {stop.collectedAmount && Number(stop.collectedAmount) > 0 && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Cobrado: {formatCurrency(stop.collectedAmount)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {route.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {route.notes}
        </div>
      )}
    </div>
  )
}
