import { requireRole, getTenantId } from "@/lib/auth/server"
import { getSalesByDay, getSalesByPaymentMethod, getTopProducts } from "@/lib/queries/reports"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { DateRangePicker } from "@/components/reports/date-range-picker"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function getDefaultRange() {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
}

const METHOD_LABEL: Record<string, string> = {
  cash:     "Efectivo",
  card:     "Tarjeta",
  transfer: "Transferencia",
  credit:   "Cuenta corriente",
}

export default async function SalesReportPage({
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

  const [byDay, byMethod, topProducts] = await Promise.all([
    getSalesByDay(tenantId, from, to),
    getSalesByPaymentMethod(tenantId, from, to),
    getTopProducts(tenantId, from, to),
  ])

  const totalRevenue = byDay.reduce((s, r) => s + Number(r.total), 0)
  const totalOrders  = byDay.reduce((s, r) => s + Number(r.count), 0)
  const avgTicket    = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const maxDay       = byDay.length > 0 ? Math.max(...byDay.map(r => Number(r.total))) : 1

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">Reporte de Ventas</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{from} → {to}</p>
        </div>
        <DateRangePicker from={from} to={to} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Ingresos totales", value: formatCurrency(totalRevenue), color: "text-green-600" },
          { label: "Cantidad de ventas", value: formatNumber(totalOrders, 0), color: "text-zinc-800" },
          { label: "Ticket promedio",   value: formatCurrency(avgTicket),   color: "text-zinc-800" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Ventas por día */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Ventas por día</h3>
        </div>
        {byDay.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-10">Sin ventas en el período</p>
        ) : (
          <div className="divide-y divide-zinc-50">
            {byDay.map(r => {
              const pct = maxDay > 0 ? (Number(r.total) / maxDay) * 100 : 0
              return (
                <div key={r.date} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-sm text-zinc-600 w-28 shrink-0">{r.date}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-800 w-24 text-right">
                    {formatCurrency(r.total)}
                  </span>
                  <span className="text-xs text-zinc-400 w-14 text-right">{r.count} vtas</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Por método de pago */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
            <h3 className="font-semibold text-zinc-800 text-sm">Por método de pago</h3>
          </div>
          {byMethod.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-8">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-50">
                {byMethod.map(r => (
                  <tr key={r.method} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-700">
                      {METHOD_LABEL[r.method ?? ""] ?? r.method ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-800">
                      {formatCurrency(r.total)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400 text-xs">{r.count} vtas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
            <h3 className="font-semibold text-zinc-800 text-sm">Top productos</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-8">Sin datos</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-50">
                {topProducts.map(p => (
                  <tr key={p.productId} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-700">{p.name}</td>
                    <td className="px-5 py-3 text-right text-zinc-500 text-xs">{formatNumber(p.quantity, 0)} u</td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-800">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
