import { requireRole, getTenantId } from "@/lib/auth/server"
import { getKpiSummary, getSalesByDay, getSalesByPaymentMethod, getTopProducts } from "@/lib/queries/reports"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { TrendingUp, ShoppingBag, ChefHat, Truck, AlertTriangle } from "lucide-react"
import { ReportCharts } from "@/components/reports/report-charts"
import { DateRangePicker } from "@/components/reports/date-range-picker"

function getDefaultRange() {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return {
    from: from.toISOString().split("T")[0],
    to:   to.toISOString().split("T")[0],
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const params   = await searchParams
  const defaults = getDefaultRange()
  const from     = params.from ?? defaults.from
  const to       = params.to   ?? defaults.to

  const [kpis, salesByDay, salesByMethod, topProducts] = await Promise.all([
    getKpiSummary(tenantId, from, to),
    getSalesByDay(tenantId, from, to),
    getSalesByPaymentMethod(tenantId, from, to),
    getTopProducts(tenantId, from, to),
  ])

  const kpiCards = [
    {
      label:       "Ingresos totales",
      value:       formatCurrency(kpis.totalRevenue),
      icon:        TrendingUp,
      color:       "text-green-600",
      bg:          "bg-green-50",
      sub:         `${kpis.totalSales} ventas`,
    },
    {
      label:       "Ticket promedio",
      value:       formatCurrency(kpis.avgTicket),
      icon:        ShoppingBag,
      color:       "text-blue-600",
      bg:          "bg-blue-50",
      sub:         "por venta",
    },
    {
      label:       "Producción total",
      value:       formatNumber(kpis.totalProduced, 0) + " u",
      icon:        ChefHat,
      color:       "text-zinc-600",
      bg:          "bg-zinc-100",
      sub:         `Merma: ${formatNumber(kpis.totalWaste, 0)} u`,
    },
    {
      label:       "% Merma",
      value:       formatNumber(kpis.wasteRate, 1) + "%",
      icon:        AlertTriangle,
      color:       kpis.wasteRate > 10 ? "text-red-600" : "text-amber-500",
      bg:          kpis.wasteRate > 10 ? "bg-red-50" : "bg-amber-50",
      sub:         kpis.wasteRate > 10 ? "Alto — revisar" : "Dentro del rango",
    },
    {
      label:       "Pedidos entregados",
      value:       String(kpis.deliveredOrders),
      icon:        Truck,
      color:       "text-indigo-600",
      bg:          "bg-indigo-50",
      sub:         "en el período",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Reportes Gerenciales</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Período: {from} → {to}
          </p>
        </div>
        <DateRangePicker from={from} to={to} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-medium text-zinc-500 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Gráficos y tablas */}
      <ReportCharts
        salesByDay={salesByDay.map(r => ({
          date:  r.date,
          total: Number(r.total),
          count: Number(r.count),
        }))}
        salesByMethod={salesByMethod.map(r => ({
          method: r.method,
          total:  Number(r.total),
          count:  Number(r.count),
        }))}
        topProducts={topProducts.map(r => ({
          name:     r.name,
          quantity: Number(r.quantity),
          revenue:  Number(r.revenue),
        }))}
      />
    </div>
  )
}
