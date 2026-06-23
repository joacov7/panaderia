import { requireRole, getTenantId } from "@/lib/auth/server"
import { getProductionSummary } from "@/lib/queries/reports"
import { formatNumber } from "@/lib/utils/currency"
import { DateRangePicker } from "@/components/reports/date-range-picker"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function getDefaultRange() {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
}

export default async function ProductionReportPage({
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

  const rows = await getProductionSummary(tenantId, from, to)

  const totals = rows.reduce((acc, r) => ({
    planned:  acc.planned  + Number(r.planned),
    produced: acc.produced + Number(r.produced),
    waste:    acc.waste    + Number(r.waste),
  }), { planned: 0, produced: 0, waste: 0 })

  const efficiency = totals.planned > 0 ? (totals.produced / totals.planned) * 100 : 0
  const wasteRate  = totals.produced > 0 ? (totals.waste / totals.produced) * 100 : 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">Reporte de Producción</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{from} → {to}</p>
        </div>
        <DateRangePicker from={from} to={to} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total planificado", value: formatNumber(totals.planned, 0) + " u", color: "text-zinc-800" },
          { label: "Total producido",   value: formatNumber(totals.produced, 0) + " u", color: "text-green-600" },
          { label: "Eficiencia",         value: formatNumber(efficiency, 1) + "%",       color: efficiency >= 90 ? "text-green-600" : "text-amber-600" },
          { label: "% Merma",            value: formatNumber(wasteRate, 1) + "%",        color: wasteRate > 10 ? "text-red-600" : "text-zinc-800" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla por día */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Detalle por día</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-10">Sin datos de producción en el período</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Fecha</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Planificado</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Producido</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Merma</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Eficiencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rows.map(r => {
                const eff = Number(r.planned) > 0 ? (Number(r.produced) / Number(r.planned)) * 100 : 0
                return (
                  <tr key={r.date} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-700">{r.date}</td>
                    <td className="px-5 py-3 text-right text-zinc-600">{formatNumber(r.planned, 0)}</td>
                    <td className="px-5 py-3 text-right font-medium text-green-600">{formatNumber(r.produced, 0)}</td>
                    <td className="px-5 py-3 text-right text-amber-600">{formatNumber(r.waste, 0)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${eff >= 90 ? "text-green-600" : "text-amber-600"}`}>
                      {formatNumber(eff, 1)}%
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
