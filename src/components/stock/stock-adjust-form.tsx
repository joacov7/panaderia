"use client"

import { useState } from "react"
import { adjustStock } from "@/lib/actions/stock"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SlidersHorizontal } from "lucide-react"

interface Props {
  entityType:   "raw_material" | "finished_product"
  entityId:     string
  currentStock: number
  unit:         string
}

export function StockAdjustForm({ entityType, entityId, currentStock, unit }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes]       = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = Number(quantity)
    if (qty === 0) { toast.error("La cantidad no puede ser cero"); return }
    setLoading(true)
    try {
      const result = await adjustStock({ entityType, entityId, quantity: qty, notes })
      toast.success(`Stock actualizado: ${result.newStock} ${unit}`)
      setOpen(false)
      setQuantity("")
      setNotes("")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al ajustar stock")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-zinc-300 text-zinc-700 px-3 py-2
                   rounded-lg text-sm font-medium hover:bg-white transition-colors">
        <SlidersHorizontal className="w-4 h-4" />
        Ajustar stock
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Ajuste ({currentStock} actual) — positivo=entrada, negativo=salida
        </label>
        <input
          type="number" step="0.001" required
          value={quantity} onChange={e => setQuantity(e.target.value)}
          placeholder="+50 o -10"
          className="w-28 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-right
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Motivo *</label>
        <input
          value={notes} onChange={e => setNotes(e.target.value)} required
          placeholder="Ej: Inventario físico"
          className="w-44 border border-zinc-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      <button type="submit" disabled={loading}
        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium
                   hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? "..." : "Confirmar"}
      </button>
      <button type="button" onClick={() => setOpen(false)}
        className="text-sm text-zinc-400 hover:text-zinc-700 px-2 py-2">
        Cancelar
      </button>
    </form>
  )
}
