"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPurchaseOrder } from "@/lib/actions/purchases"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Supplier, RawMaterial } from "@/db/schema"

interface LineItem {
  rawMaterialId:   string
  quantityOrdered: number
  unitCost:        number
}

interface Props {
  suppliers:    Supplier[]
  rawMaterials: RawMaterial[]
}

const today = new Date().toISOString().split("T")[0]

export function NewPurchaseForm({ suppliers, rawMaterials }: Props) {
  const router = useRouter()
  const [loading, setLoading]         = useState(false)
  const [supplierId, setSupplierId]   = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes]             = useState("")
  const [items, setItems]             = useState<LineItem[]>([{ rawMaterialId: "", quantityOrdered: 1, unitCost: 0 }])

  function addItem() {
    setItems(prev => [...prev, { rawMaterialId: "", quantityOrdered: 1, unitCost: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleMaterialChange(idx: number, rawMaterialId: string) {
    const mp = rawMaterials.find(m => m.id === rawMaterialId)
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, rawMaterialId, unitCost: mp ? Number(mp.costPerUnit) : 0 } : item
    ))
  }

  function updateItem(idx: number, field: keyof LineItem, value: number | string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.rawMaterialId || !i.quantityOrdered || !i.unitCost)) {
      toast.error("Completá todos los campos de cada ítem")
      return
    }
    setLoading(true)
    try {
      const order = await createPurchaseOrder({
        supplierId,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items,
      })
      toast.success("Orden de compra creada")
      router.push(`/purchases/${order.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear OC")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-800 text-sm">Datos de la orden</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Proveedor *</label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Seleccionar proveedor...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Fecha de entrega estimada</label>
            <input
              type="date"
              value={expectedDate}
              onChange={e => setExpectedDate(e.target.value)}
              min={today}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Notas</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instrucciones al proveedor..."
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 text-sm">Materias primas</h3>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <select
                value={item.rawMaterialId}
                onChange={e => handleMaterialChange(idx, e.target.value)}
                required
                className="flex-1 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Materia prima...</option>
                {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input
                type="number" min="0.001" step="0.001"
                value={item.quantityOrdered}
                onChange={e => updateItem(idx, "quantityOrdered", Number(e.target.value))}
                required placeholder="Cant."
                className="w-24 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <input
                type="number" min="0.01" step="0.01"
                value={item.unitCost}
                onChange={e => updateItem(idx, "unitCost", Number(e.target.value))}
                required placeholder="Costo/u"
                className="w-28 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="button" onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="p-2 text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <p className="text-sm font-semibold text-zinc-800">
              Total: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit" disabled={loading}
          className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium
                     hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear orden"}
        </button>
      </div>
    </form>
  )
}
