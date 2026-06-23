import { requireRole } from "@/lib/auth/server"
import { db } from "@/db"
import { deliveryRoutes } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"

const STOP_ICONS = {
  pending:   { icon: Clock,         color: "text-zinc-400" },
  delivered: { icon: CheckCircle,   color: "text-green-500" },
  partial:   { icon: AlertCircle,   color: "text-amber-500" },
  failed:    { icon: XCircle,       color: "text-red-500" },
}

export default async function RouteDetailPage({ params }: { params: Promise<{ routeId: string }> }) {
  const session = await requireRole(["delivery", "admin", "owner"])
  const { routeId } = await params

  const route = await db.query.deliveryRoutes.findFirst({
    where: and(
      eq(deliveryRoutes.id, routeId),
      eq(deliveryRoutes.tenantId, session.user.tenantId)
    ),
    with: {
      stops: {
        with: {
          client:  { columns: { name: true, address: true, phone: true } },
          order:   { with: { items: { with: { product: { columns: { name: true } } } } } },
        },
        orderBy: (stops, { asc }) => [asc(stops.stopSequence)],
      },
    },
  })

  if (!route) notFound()

  return (
    <div className="pb-20">
      <div className="px-4 py-3 bg-white border-b border-zinc-200 flex items-center gap-3">
        <Link href="/driver" className="text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="font-semibold text-zinc-800 text-sm">Ruta del día</p>
          <p className="text-xs text-zinc-400">
            {route.stops.filter(s => s.status === "delivered").length}/{route.stops.length} entregadas
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {route.stops.map((stop, idx) => {
          const { icon: Icon, color } = STOP_ICONS[stop.status]
          const totalItems = stop.order?.items.length ?? 0

          return (
            <Link
              key={stop.id}
              href={`/driver/${routeId}/stop/${stop.id}`}
              className="block bg-white rounded-xl border border-zinc-200 p-4 active:bg-zinc-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-6 h-6 bg-zinc-900 text-white rounded-full text-xs
                                   flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-800 truncate">{stop.client?.name}</p>
                    <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                  </div>
                  {stop.client?.address && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{stop.client.address}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-zinc-400">
                      {totalItems} producto{totalItems !== 1 ? "s" : ""}
                    </span>
                    {stop.client?.phone && (
                      <a
                        href={`tel:${stop.client.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 font-medium"
                      >
                        Llamar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
