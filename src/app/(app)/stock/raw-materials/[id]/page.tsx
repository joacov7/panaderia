import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRawMaterialById, getStockMovements, getCategories, getUnits } from "@/lib/queries/stock"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StockAdjustForm } from "@/components/stock/stock-adjust-form"
import { RawMaterialEditForm } from "@/components/stock/raw-material-edit-form"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { stockMovements } from "@/db/schema"
import { and } from "drizzle-orm"

const MOVEMENT_LABELS: Record<string, { label: string; sign: string; color: string }> = {
  production_in:  { label: "Producción (entrada)", sign: "+", color: "text-green-600" },
  production_out: { label: "Producción (consumo)", sign: "-", color: "text-red-600" },
  sale:           { label: "Venta",                sign: "-", color: "text-red-600" },
  purchase:       { label: "Compra",               sign: "+", color: "text-green-600" },
  adjustment:     { label: "Ajuste",               sign: "",  color: "text-blue-600" },
  initial:        { label: "Stock inicial",        sign: "+", color: "text-zinc-500" },
}

export default async function RawMaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const { id } = await params

  const [mp, categories, units] = await Promise.all([
    getRawMaterialById(id, tenantId),
    getCategories(tenantId),
    getUnits(tenantId),
  ])

  if (!mp) notFound()

  const movements = await db.query.stockMovements.findMany({
    where: and(
      eq(stockMovements.tenantId, tenantId),
      eq(stockMovements.entityId, id),
    ),
    orderBy: (m, { desc }) => desc(m.createdAt),
    limit: 30,
    with: { createdBy: { columns: { name: true } } },
  })

  const alert = Number(mp.stockCurrent) <= Number(mp.stockMin)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/stock?tab=mp" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">{mp.name}</h2>
          <p className="text-sm text-zinc-500">{mp.category?.name} · {mp.unit?.abbreviation}</p>
        </div>
      </div>

      {/* Stock card */}
      <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap
        ${alert ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
        <div>
          <p className="text-xs text-zinc-400 font-medium">Stock actual</p>
          <p className={`text-3xl font-bold mt-1 ${alert ? "text-red-600" : "text-zinc-900"}`}>
            {formatNumber(mp.stockCurrent, 2)} {mp.unit?.abbreviation}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Mínimo: {formatNumber(mp.stockMin, 2)} · Costo: {formatCurrency(mp.costPerUnit)}
          </p>
        </div>
        <StockAdjustForm entityType="raw_material" entityId={id} currentStock={Number(mp.stockCurrent)} unit={mp.unit?.abbreviation ?? ""} />
      </div>

      {/* Edición de datos */}
      <RawMaterialEditForm
        rawMaterialId={id}
        defaultValues={{
          name:         mp.name,
          sku:          mp.sku ?? "",
          categoryId:   mp.categoryId ?? "",
          unitId:       mp.unitId,
          stockMin:     Number(mp.stockMin),
          costPerUnit:  Number(mp.costPerUnit),
        }}
        categories={categories}
        units={units}
      />

      {/* Movimientos */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-medium text-zinc-700 text-sm">Historial de movimientos</h3>
        </div>
        {movements.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-10">Sin movimientos</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Tipo</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Cantidad</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Stock tras mov.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {movements.map(m => {
                const cfg = MOVEMENT_LABELS[m.movementType] ?? { label: m.movementType, sign: "", color: "text-zinc-600" }
                return (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-500 text-xs">
                      {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-medium text-xs ${cfg.color}`}>{cfg.label}</span>
                      {m.notes && <p className="text-xs text-zinc-400">{m.notes}</p>}
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold ${cfg.color}`}>
                      {cfg.sign}{formatNumber(m.quantity, 3)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-700">
                      {formatNumber(m.stockAfter, 3)}
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
