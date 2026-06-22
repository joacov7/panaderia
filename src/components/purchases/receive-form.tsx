"use client"

import { useState } from "react"
import { receivePurchaseOrder } from "@/lib/actions/purchases"
import { useRouter } from "next/navigation"
import { formatNumber } from "@/lib/utils/currency"
import { PackageCheck } from "lucide-react"
import { toast } from "sonner"

interface ReceiveItem {
  id:               string
  rawMaterialId:    string
  name:             string
  unit:             string
  quantityOrdered:  number
  quantityReceived: number
  unitCost:         number
}

interface Props {
  purchaseOrderId: string
  items:           ReceiveItem[]
}

export function ReceiveForm({ purchaseOrderId, items }: Props) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, { qty: string; cost: string }>>(() =>
    Object.fromEntries(items.map(i => [i.id, {
      qty:  String(i.quantityOrdered - i.quantityReceived),
      cost: String(i.unitCost),
    }]))
  )

  function update(id: string, field: "qty" | "cost", value: string) {
    setValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await receivePurchaseOrder({
        purchaseOrderId,
        items: items.map(i => ({
          itemId:           i.id,
          rawMaterialId:    i.rawMaterialId,
          quantityReceived: Number(values[i.id]?.qty ?? 0),
          unitCost:         Number(values[i.id]?.cost ?? i.unitCost),
        })),
      })
      toast.success("Recepción registrada. Stock actualizado.")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Error al registrar recepción")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl
                   font-medium text-sm hover:bg-green-700 transition-colors"
      >
        <PackageCheck className="w-4 h-4" />
        Registrar recepción de mercadería
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 bg-green-50">
        <h3 className="font-semibold text-green-800 text-sm flex items-center gap-2">
          <PackageCheck className="w-4 h-4" />
          Registrar recepción
        </h3>
        <p className="text-xs text-green-700 mt-0.5">
          Ingresá las cantidades realmente recibidas. El stock se actualizará automáticamente.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Material</th>
            <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Pendiente</th>
            <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Cant. recibida</th>
            <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Costo/u</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {items.map(item => {
            const pending = item.quantityOrdered - item.quantityReceived
            return (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-zinc-800">
                  {item.name}
                  <span className="text-xs text-zinc-400 ml-1">({item.unit})</span>
                </td>
                <td className="px-5 py-3 text-right text-zinc-500">
                  {formatNumber(pending, 3)}
                </td>
                <td className="px-5 py-3 text-right">
                  <input
                    type="number"
                    min="0"
                    max={pending}
                    step="0.001"
                    value={values[item.id]?.qty ?? ""}
                    onChange={e => update(item.id, "qty", e.target.value)}
                    className="w-24 text-right border border-zinc-300 rounded-lg px-2 py-1.5
                               focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-zinc-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={values[item.id]?.cost ?? ""}
                      onChange={e => update(item.id, "cost", e.target.value)}
                      className="w-24 text-right border border-zinc-300 rounded-lg px-2 py-1.5
                                 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="px-5 py-4 border-t border-zinc-100 flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                     hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Confirmar recepción"}
        </button>
      </div>
    </form>
  )
}
