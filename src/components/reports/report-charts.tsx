"use client"

import { formatCurrency, formatNumber } from "@/lib/utils/currency"

interface SalesByDay    { date: string; total: number; count: number }
interface SalesByMethod { method: string; total: number; count: number }
interface TopProduct    { name: string; quantity: number; revenue: number }

interface Props {
  salesByDay:    SalesByDay[]
  salesByMethod: SalesByMethod[]
  topProducts:   TopProduct[]
}

const METHOD_LABELS: Record<string, string> = {
  cash:     "Efectivo",
  card:     "Tarjeta",
  transfer: "Transferencia",
  account:  "Cuenta corriente",
}

const METHOD_COLORS: Record<string, string> = {
  cash:     "bg-green-500",
  card:     "bg-blue-500",
  transfer: "bg-purple-500",
  account:  "bg-amber-500",
}

export function ReportCharts({ salesByDay, salesByMethod, topProducts }: Props) {
  const maxDailyTotal = Math.max(...salesByDay.map(d => d.total), 1)
  const totalRevenue  = salesByMethod.reduce((s, m) => s + m.total, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Ventas por día — gráfico de barras CSS */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-800 text-sm mb-4">Ventas diarias</h3>
        {salesByDay.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-10">Sin datos en el período</p>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {salesByDay.map(day => {
              const heightPct = (day.total / maxDailyTotal) * 100
              const dateLabel = day.date.slice(5) // MM-DD
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 min-w-[28px] group">
                  <div className="relative w-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
                                    bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatCurrency(day.total)}
                      <br />
                      <span className="text-zinc-400">{day.count} venta{day.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div
                      className="bg-zinc-900 rounded-t-sm w-full transition-all"
                      style={{ height: `${Math.max(4, (heightPct / 100) * 136)}px` }}
                    />
                  </div>
                  <span className="text-zinc-400 text-[10px] rotate-45 origin-left">{dateLabel}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Métodos de pago */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-800 text-sm mb-4">Por método de pago</h3>
        {salesByMethod.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-10">Sin datos</p>
        ) : (
          <div className="space-y-3">
            {salesByMethod.map(m => {
              const pct = totalRevenue > 0 ? (m.total / totalRevenue) * 100 : 0
              return (
                <div key={m.method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700">{METHOD_LABELS[m.method] ?? m.method}</span>
                    <span className="text-zinc-500">{formatCurrency(m.total)}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${METHOD_COLORS[m.method] ?? "bg-zinc-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatNumber(pct, 1)}% · {m.count} op.</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top productos */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Top productos por ingresos</h3>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-10">Sin datos en el período</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">#</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Producto</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Unidades</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Ingresos</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {topProducts.map((p, i) => {
                const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0
                return (
                  <tr key={p.name} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-zinc-800">{p.name}</td>
                    <td className="px-5 py-3 text-right text-zinc-600">{formatNumber(p.quantity, 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-800">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-zinc-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 bg-zinc-900 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-zinc-500 text-xs w-10 text-right">
                          {formatNumber(pct, 1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
