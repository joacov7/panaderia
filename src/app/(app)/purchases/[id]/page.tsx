import { requireRole, getTenantId } from "@/lib/auth/server"
import { getPurchaseOrderById } from "@/lib/queries/purchases"
import { notFound } from "next/navigation"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ReceiveForm } from "@/components/purchases/receive-form"

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const { id } = await params

  const order = await getPurchaseOrderById(id, tenantId)
  if (!order) notFound()

  const canReceive = ["draft", "sent", "partial"].includes(order.status)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/purchases" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Orden de Compra</h2>
          <p className="text-sm text-zinc-500">{order.supplier?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5 flex gap-6 flex-wrap">
        <div>
          <p className="text-xs text-zinc-400 font-medium">Fecha</p>
          <p className="text-sm font-medium text-zinc-800 mt-0.5">
            {format(new Date(order.orderDate), "dd MMM yyyy", { locale: es })}
          </p>
        </div>
        {order.expectedDate && (
          <div>
            <p className="text-xs text-zinc-400 font-medium">Entrega estimada</p>
            <p className="text-sm font-medium text-zinc-800 mt-0.5">
              {format(new Date(order.expectedDate), "dd MMM yyyy", { locale: es })}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-zinc-400 font-medium">Total</p>
          <p className="text-sm font-bold text-zinc-800 mt-0.5">{formatCurrency(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 font-medium">Creada por</p>
          <p className="text-sm font-medium text-zinc-800 mt-0.5">{order.createdBy?.name}</p>
        </div>
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-medium text-zinc-700 text-sm">Productos</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Material</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Pedido</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Recibido</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Costo/u</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {order.items.map(item => {
              const pct = Number(item.quantityOrdered) > 0
                ? Math.round((Number(item.quantityReceived) / Number(item.quantityOrdered)) * 100)
                : 0
              return (
                <tr key={item.id}>
                  <td className="px-5 py-3 font-medium text-zinc-800">
                    {item.rawMaterial?.name}
                    <span className="text-xs text-zinc-400 ml-1">
                      ({item.rawMaterial?.unit?.abbreviation})
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-600">
                    {formatNumber(item.quantityOrdered, 3)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={pct >= 100 ? "text-green-600 font-semibold" : "text-amber-600"}>
                      {formatNumber(item.quantityReceived, 3)}
                    </span>
                    <span className="text-xs text-zinc-400 ml-1">({pct}%)</span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-600">{formatCurrency(item.unitCost)}</td>
                  <td className="px-5 py-3 text-right font-medium text-zinc-800">{formatCurrency(item.subtotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Formulario de recepción */}
      {canReceive && (
        <ReceiveForm
          purchaseOrderId={order.id}
          items={order.items.map(i => ({
            id:               i.id,
            rawMaterialId:    i.rawMaterialId,
            name:             i.rawMaterial?.name ?? "",
            unit:             i.rawMaterial?.unit?.abbreviation ?? "",
            quantityOrdered:  Number(i.quantityOrdered),
            quantityReceived: Number(i.quantityReceived),
            unitCost:         Number(i.unitCost),
          }))}
        />
      )}
    </div>
  )
}
