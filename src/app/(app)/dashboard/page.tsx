import { requireAuth } from "@/lib/auth/server"
import { db } from "@/db"
import { products, rawMaterials, orders, productionOrders } from "@/db/schema"
import { eq, and, gte, sql } from "drizzle-orm"
import { formatCurrency } from "@/lib/utils/currency"
import { Package, ChefHat, AlertTriangle, ShoppingBag } from "lucide-react"

async function getDashboardStats(tenantId: string) {
  const today = new Date().toISOString().split("T")[0]

  const [lowStockMP, lowStockPT, pendingOrders, productionToday] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(rawMaterials)
      .where(and(
        eq(rawMaterials.tenantId, tenantId),
        eq(rawMaterials.isActive, true),
        sql`${rawMaterials.stockCurrent} <= ${rawMaterials.stockMin}`
      )),

    db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        sql`${products.stockCurrent} <= ${products.stockMin}`
      )),

    db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenantId),
        eq(orders.status, "pending"),
        eq(orders.deliveryDate, today)
      )),

    db.select({ count: sql<number>`count(*)` })
      .from(productionOrders)
      .where(and(
        eq(productionOrders.tenantId, tenantId),
        eq(productionOrders.date, today)
      )),
  ])

  return {
    lowStockMP:      Number(lowStockMP[0]?.count ?? 0),
    lowStockPT:      Number(lowStockPT[0]?.count ?? 0),
    pendingOrders:   Number(pendingOrders[0]?.count ?? 0),
    productionToday: Number(productionToday[0]?.count ?? 0),
  }
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const stats = await getDashboardStats(session.user.tenantId)

  const kpis = [
    {
      label: "Alertas MP",
      value: stats.lowStockMP,
      icon: AlertTriangle,
      color: stats.lowStockMP > 0 ? "text-red-600" : "text-green-600",
      bg: stats.lowStockMP > 0 ? "bg-red-50" : "bg-green-50",
      description: "Materias primas bajo mínimo",
    },
    {
      label: "Alertas Stock PT",
      value: stats.lowStockPT,
      icon: Package,
      color: stats.lowStockPT > 0 ? "text-amber-600" : "text-green-600",
      bg: stats.lowStockPT > 0 ? "bg-amber-50" : "bg-green-50",
      description: "Productos terminados bajo mínimo",
    },
    {
      label: "Pedidos pendientes hoy",
      value: stats.pendingOrders,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Pedidos para entregar hoy",
    },
    {
      label: "Órdenes de producción",
      value: stats.productionToday,
      icon: ChefHat,
      color: "text-zinc-600",
      bg: "bg-zinc-100",
      description: "Órdenes creadas hoy",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Buen día, {session.user.name.split(" ")[0]} 👋</h2>
        <p className="text-zinc-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 font-medium">{kpi.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-zinc-400 mt-1">{kpi.description}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
