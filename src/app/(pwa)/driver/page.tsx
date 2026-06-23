import { requireRole, getTenantId } from "@/lib/auth/server"
import { getServerSession } from "@/lib/auth/server"
import { db } from "@/db"
import { deliveryRoutes, deliveryRouteStops } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import Link from "next/link"
import { MapPin, CheckCircle, Clock } from "lucide-react"

export default async function DriverPage() {
  const session = await requireRole(["delivery", "admin", "owner"])
  const tenantId = session.user.tenantId
  const today = new Date().toISOString().split("T")[0]

  const routes = await db.query.deliveryRoutes.findMany({
    where: and(
      eq(deliveryRoutes.tenantId, tenantId),
      eq(deliveryRoutes.assignedTo, session.user.id),
      eq(deliveryRoutes.date, today)
    ),
    with: { stops: true },
  })

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Mis rutas de hoy</h2>
        <p className="text-sm text-zinc-500">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <MapPin className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-zinc-500 font-medium text-sm">No tenés rutas asignadas para hoy</p>
        </div>
      ) : (
        routes.map(route => {
          const done = route.stops.filter(s => s.status === "delivered").length
          const total = route.stops.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <Link
              key={route.id}
              href={`/driver/${route.id}`}
              className="block bg-white rounded-xl border border-zinc-200 p-4 active:bg-zinc-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {route.status === "completed"
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Clock className="w-5 h-5 text-blue-500" />
                  }
                  <span className="font-semibold text-zinc-800">
                    {route.status === "completed" ? "Completada" : "En curso"}
                  </span>
                </div>
                <span className="text-sm text-zinc-500">{done}/{total} paradas</span>
              </div>

              <div className="w-full bg-zinc-100 rounded-full h-2">
                <div
                  className="bg-zinc-900 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {route.vehicleInfo && (
                <p className="text-xs text-zinc-400 mt-2">{route.vehicleInfo}</p>
              )}
            </Link>
          )
        })
      )}
    </div>
  )
}
