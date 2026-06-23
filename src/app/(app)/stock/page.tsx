import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRawMaterials, getProducts, getStockAlerts } from "@/lib/queries/stock"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import Link from "next/link"
import { Plus, AlertTriangle, Package, Wheat } from "lucide-react"

function StockRow({
  name, sku, unit, stockCurrent, stockMin, extra,
  href, alert,
}: {
  name: string; sku?: string | null; unit: string
  stockCurrent: number; stockMin: number
  extra?: string; href: string; alert: boolean
}) {
  return (
    <tr className={`hover:bg-zinc-50 transition-colors ${alert ? "bg-red-50/40" : ""}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          {alert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          <div>
            <p className="font-medium text-zinc-800">{name}</p>
            {sku && <p className="text-xs text-zinc-400">{sku}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className={`font-semibold ${alert ? "text-red-600" : "text-zinc-800"}`}>
          {formatNumber(stockCurrent, 2)} {unit}
        </span>
      </td>
      <td className="px-5 py-3.5 text-zinc-500">
        {formatNumber(stockMin, 2)} {unit}
      </td>
      {extra && <td className="px-5 py-3.5 text-zinc-600">{extra}</td>}
      <td className="px-5 py-3.5 text-right">
        <Link href={href} className="text-zinc-500 hover:text-zinc-900 font-medium text-xs">
          Ver →
        </Link>
      </td>
    </tr>
  )
}

export default async function StockPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const { tab = "mp" } = await searchParams

  const [mp, pt, alerts] = await Promise.all([
    getRawMaterials(tenantId),
    getProducts(tenantId),
    getStockAlerts(tenantId),
  ])

  const totalAlerts = alerts.rawMaterials.length + alerts.products.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Stock</h2>
          {totalAlerts > 0 && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {totalAlerts} alerta{totalAlerts !== 1 ? "s" : ""} de stock mínimo
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/stock/raw-materials/new"
            className="flex items-center gap-2 border border-zinc-300 text-zinc-700 px-3 py-2
                       rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Materia prima
          </Link>
          <Link
            href="/stock/products/new"
            className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-2
                       rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Producto
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {[
          { key: "mp", label: "Materias Primas", icon: Wheat, count: mp.length },
          { key: "pt", label: "Productos Terminados", icon: Package, count: pt.length },
          { key: "mov", label: "Movimientos", icon: null, count: null },
        ].map(t => (
          <Link
            key={t.key}
            href={`/stock?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            {t.label}
            {t.count !== null && (
              <span className="text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Contenido por tab */}
      {tab === "mp" && (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {mp.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-16">No hay materias primas registradas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Stock actual</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Stock mínimo</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Costo/u</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mp.map(m => (
                  <StockRow
                    key={m.id}
                    name={m.name} sku={m.sku}
                    unit={m.unit?.abbreviation ?? ""}
                    stockCurrent={Number(m.stockCurrent)}
                    stockMin={Number(m.stockMin)}
                    extra={formatCurrency(m.costPerUnit)}
                    href={`/stock/raw-materials/${m.id}`}
                    alert={Number(m.stockCurrent) <= Number(m.stockMin)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "pt" && (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {pt.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-16">No hay productos registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Stock actual</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Stock mínimo</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500">Precio venta</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pt.map(p => (
                  <StockRow
                    key={p.id}
                    name={p.name} sku={p.sku}
                    unit={p.unit?.abbreviation ?? ""}
                    stockCurrent={Number(p.stockCurrent)}
                    stockMin={Number(p.stockMin)}
                    extra={formatCurrency(p.salePrice)}
                    href={`/stock/products/${p.id}`}
                    alert={Number(p.stockCurrent) <= Number(p.stockMin)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "mov" && (
        <Link
          href="/stock/movements"
          className="block bg-white rounded-xl border border-zinc-200 p-6 text-center
                     text-zinc-500 hover:bg-zinc-50 transition-colors text-sm"
        >
          Ver historial completo de movimientos →
        </Link>
      )}
    </div>
  )
}
