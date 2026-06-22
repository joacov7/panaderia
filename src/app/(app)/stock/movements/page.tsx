import { requireRole, getTenantId } from "@/lib/auth/server"
import { getStockMovements } from "@/lib/queries/stock"
import { db } from "@/db"
import { rawMaterials, products } from "@/db/schema"
import { eq } from "drizzle-orm"
import { formatNumber } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  production_in:  { label: "Producción (entrada)", color: "text-green-600" },
  production_out: { label: "Producción (consumo)", color: "text-red-600" },
  sale:           { label: "Venta",                color: "text-red-600" },
  purchase:       { label: "Compra",               color: "text-green-600" },
  adjustment:     { label: "Ajuste manual",        color: "text-blue-600" },
  delivery_return:{ label: "Devolución reparto",   color: "text-amber-600" },
  initial:        { label: "Stock inicial",        color: "text-zinc-500" },
}

export default async function MovementsPage() {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const movements = await getStockMovements(tenantId, 100)

  // Resolver nombres de entidades de forma eficiente
  const mpIds   = [...new Set(movements.filter(m => m.entityType === "raw_material").map(m => m.entityId))]
  const ptIds   = [...new Set(movements.filter(m => m.entityType === "finished_product").map(m => m.entityId))]

  const [mpItems, ptItems] = await Promise.all([
    mpIds.length ? db.select({ id: rawMaterials.id, name: rawMaterials.name }).from(rawMaterials).where(eq(rawMaterials.tenantId, tenantId)) : [],
    ptIds.length ? db.select({ id: products.id, name: products.name }).from(products).where(eq(products.tenantId, tenantId)) : [],
  ])

  const nameMap = new Map([
    ...mpItems.map(m => [m.id, m.name] as [string, string]),
    ...ptItems.map(p => [p.id, p.name] as [string, string]),
  ])

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/stock" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Historial de movimientos</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Últimos {movements.length} movimientos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-5 py-3 font-medium text-zinc-500">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">Tipo</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">Entidad</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-500">Cantidad</th>
              <th className="text-right px-5 py-3 font-medium text-zinc-500">Stock tras mov.</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">Notas</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {movements.map(m => {
              const cfg   = MOVEMENT_LABELS[m.movementType] ?? { label: m.movementType, color: "text-zinc-600" }
              const qty   = Number(m.quantity)
              return (
                <tr key={m.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                    {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-medium text-xs ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-zinc-800">{nameMap.get(m.entityId) ?? "—"}</p>
                      <p className="text-xs text-zinc-400">{m.entityType === "raw_material" ? "MP" : "PT"}</p>
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold ${qty >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {qty >= 0 ? "+" : ""}{formatNumber(qty, 3)}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-700 font-medium">
                    {formatNumber(m.stockAfter, 3)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 max-w-xs truncate">{m.notes ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-500">{m.createdBy?.name ?? "Sistema"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
