"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProductionOrder } from "@/lib/actions/production"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface RecipeOption {
  id:            string
  name:          string
  productId:     string
  yieldQuantity: string
  yieldUnit?:    { abbreviation: string } | null
  product?:      { name: string } | null
}

interface LineItem {
  recipeId:        string
  productId:       string
  quantityPlanned: number
}

const today = new Date().toISOString().split("T")[0]

export function NewProductionForm({ recipes }: { recipes: RecipeOption[] }) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [date, setDate]         = useState(today)
  const [shift, setShift]       = useState<"night" | "morning" | "afternoon">("morning")
  const [notes, setNotes]       = useState("")
  const [items, setItems]       = useState<LineItem[]>([{ recipeId: "", productId: "", quantityPlanned: 1 }])

  function handleRecipeChange(idx: number, recipeId: string) {
    const recipe = recipes.find(r => r.id === recipeId)
    setItems(prev => prev.map((item, i) =>
      i === idx ? {
        ...item,
        recipeId,
        productId:       recipe?.productId ?? "",
        quantityPlanned: recipe ? Number(recipe.yieldQuantity) : 1,
      } : item
    ))
  }

  function updateQty(idx: number, qty: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantityPlanned: qty } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { recipeId: "", productId: "", quantityPlanned: 1 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.recipeId || !i.quantityPlanned)) {
      toast.error("Seleccioná receta y cantidad para cada ítem")
      return
    }
    setLoading(true)
    try {
      const order = await createProductionOrder({ date, shift, notes: notes || undefined, items })
      toast.success("Orden de producción creada")
      router.push(`/production/${order.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear orden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-800 text-sm">Datos del turno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Fecha *</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Turno *</label>
            <select
              value={shift} onChange={e => setShift(e.target.value as "night" | "morning" | "afternoon")}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="night">Nocturno</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Notas</label>
            <input
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Indicaciones..."
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 text-sm">Recetas a producir</h3>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => {
            const recipe = recipes.find(r => r.id === item.recipeId)
            return (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={item.recipeId}
                  onChange={e => handleRecipeChange(idx, e.target.value)}
                  required
                  className="flex-1 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Seleccionar receta...</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.product?.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="number" min="1" step="1"
                    value={item.quantityPlanned}
                    onChange={e => updateQty(idx, Number(e.target.value))}
                    required
                    className="w-24 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                               focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {recipe?.yieldUnit && (
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      {recipe.yieldUnit.abbreviation}
                    </span>
                  )}
                </div>

                <button
                  type="button" onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="p-2 text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit" disabled={loading}
          className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium
                     hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear orden de producción"}
        </button>
      </div>
    </form>
  )
}
