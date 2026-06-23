import { requireRole, getTenantId } from "@/lib/auth/server"
import { getStockAlerts, getRawMaterials, getProducts } from "@/lib/queries/stock"
import { formatNumber } from "@/lib/utils/currency"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default async function StockReportPage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()

  const [alerts, rawMats, prods] = await Promise.all([
    getStockAlerts(tenantId),
    getRawMaterials(tenantId),
    getProducts(tenantId),
  ])

  const totalAlerts = alerts.rawMaterials.length + alerts.products.length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">Reporte de Stock</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Niveles actuales e ítems con stock bajo</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Materias primas</p>
          <p className="text-2xl font-bold text-zinc-800">{rawMats.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500 mb-1">Productos terminados</p>
          <p className="text-2xl font-bold text-zinc-800">{prods.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${totalAlerts > 0 ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
          <p className="text-xs text-zinc-500 mb-1">Alertas de stock bajo</p>
          <p className={`text-2xl font-bold ${totalAlerts > 0 ? "text-red-600" : "text-green-600"}`}>
            {totalAlerts}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {totalAlerts > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-red-700 text-sm">Ítems con stock bajo o agotado</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Ítem</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Tipo</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Actual</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Mínimo</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Déficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[...alerts.rawMaterials, ...alerts.products].map(item => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-800 font-medium">{item.name}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {item.type === "raw_material" ? "Materia prima" : "Producto"}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${item.stockCurrent <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {formatNumber(item.stockCurrent, 2)} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500">
                    {formatNumber(item.stockMin, 2)} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right text-red-600 font-semibold">
                    -{formatNumber(item.deficit, 2)} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Materias primas */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Materias primas</h3>
        </div>
        {rawMats.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">Sin materias primas registradas</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Nombre</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Categoría</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Stock actual</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Stock mín</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rawMats.map(m => {
                const current = Number(m.stockCurrent)
                const min     = Number(m.stockMin)
                const low     = current <= min
                return (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{m.name}</td>
                    <td className="px-5 py-3 text-zinc-500">{m.category?.name ?? "—"}</td>
                    <td className={`px-5 py-3 text-right font-medium ${low ? "text-red-600" : "text-zinc-800"}`}>
                      {formatNumber(current, 2)} {m.unit?.abbreviation}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400">
                      {formatNumber(min, 2)} {m.unit?.abbreviation}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${low ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {low ? "Bajo" : "OK"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Productos terminados */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-semibold text-zinc-800 text-sm">Productos terminados</h3>
        </div>
        {prods.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">Sin productos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Nombre</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Categoría</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Stock actual</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Stock mín</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {prods.map(p => {
                const current = Number(p.stockCurrent)
                const min     = Number(p.stockMin)
                const low     = current <= min
                return (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{p.name}</td>
                    <td className="px-5 py-3 text-zinc-500">{p.category?.name ?? "—"}</td>
                    <td className={`px-5 py-3 text-right font-medium ${low ? "text-red-600" : "text-zinc-800"}`}>
                      {formatNumber(current, 2)} {p.unit?.abbreviation}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400">
                      {formatNumber(min, 2)} {p.unit?.abbreviation}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${low ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {low ? "Bajo" : "OK"}
                      </span>
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
