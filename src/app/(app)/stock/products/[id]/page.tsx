import { requireRole, getTenantId } from "@/lib/auth/server"
import { getProductById, getCategories, getUnits } from "@/lib/queries/stock"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StockAdjustForm } from "@/components/stock/stock-adjust-form"
import { ProductEditForm } from "@/components/stock/product-edit-form"
import { db } from "@/db"
import { stockMovements } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

const MOVEMENT_LABELS: Record<string, { label: string; sign: string; color: string }> = {
  production_in:  { label: "Producción",    sign: "+", color: "text-green-600" },
  sale:           { label: "Venta",         sign: "-", color: "text-red-600" },
  adjustment:     { label: "Ajuste",        sign: "",  color: "text-blue-600" },
  delivery_return:{ label: "Dev. reparto",  sign: "+", color: "text-amber-600" },
  initial:        { label: "Stock inicial", sign: "+", color: "text-zinc-500" },
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const { id } = await params

  const [product, categories, units] = await Promise.all([
    getProductById(id, tenantId),
    getCategories(tenantId),
    getUnits(tenantId),
  ])

  if (!product) notFound()

  const movements = await db.query.stockMovements.findMany({
    where: and(eq(stockMovements.tenantId, tenantId), eq(stockMovements.entityId, id)),
    orderBy: desc(stockMovements.createdAt),
    limit: 30,
    with: { createdBy: { columns: { name: true } } },
  })

  const alert = Number(product.stockCurrent) <= Number(product.stockMin)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/stock?tab=pt" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">{product.name}</h2>
          <p className="text-sm text-zinc-500">{product.category?.name} · {product.unit?.abbreviation}</p>
        </div>
      </div>

      <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap
        ${alert ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
        <div>
          <p className="text-xs text-zinc-400 font-medium">Stock actual</p>
          <p className={`text-3xl font-bold mt-1 ${alert ? "text-red-600" : "text-zinc-900"}`}>
            {formatNumber(product.stockCurrent, 0)} {product.unit?.abbreviation}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Mínimo: {formatNumber(product.stockMin, 0)} · Precio: {formatCurrency(product.salePrice)}
            {product.wholesalePrice && ` · Mayor: ${formatCurrency(product.wholesalePrice)}`}
          </p>
        </div>
        <StockAdjustForm entityType="finished_product" entityId={id} currentStock={Number(product.stockCurrent)} unit={product.unit?.abbreviation ?? ""} />
      </div>

      <ProductEditForm
        productId={id}
        defaultValues={{
          name:           product.name,
          sku:            product.sku ?? "",
          categoryId:     product.categoryId ?? "",
          unitId:         product.unitId,
          salePrice:      Number(product.salePrice),
          wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : 0,
          stockMin:       Number(product.stockMin),
        }}
        categories={categories}
        units={units}
      />

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
                      {cfg.sign}{formatNumber(m.quantity, 2)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-700">
                      {formatNumber(m.stockAfter, 2)}
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
