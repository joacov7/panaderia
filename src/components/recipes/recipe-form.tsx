"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRecipe, updateRecipe } from "@/lib/actions/recipes"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { RawMaterial, Product, UnitOfMeasure } from "@/db/schema"

interface IngredientRow {
  rawMaterialId: string
  quantity:      number
  unitId:        string
  notes:         string
}

interface DefaultValues {
  productId:     string
  name:          string
  yieldQuantity: number
  yieldUnitId:   string
  notes:         string
  items:         IngredientRow[]
}

interface Props {
  mode:          "create" | "edit"
  recipeId?:     string
  defaultValues?: DefaultValues
  rawMaterials:  RawMaterial[]
  products:      Product[]
  units:         UnitOfMeasure[]
}

const EMPTY_ITEM: IngredientRow = { rawMaterialId: "", quantity: 0, unitId: "", notes: "" }

export function RecipeForm({ mode, recipeId, defaultValues, rawMaterials, products, units }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(mode === "create")
  const [loading, setLoading]   = useState(false)

  const [productId, setProductId]         = useState(defaultValues?.productId ?? "")
  const [name, setName]                   = useState(defaultValues?.name ?? "")
  const [yieldQty, setYieldQty]           = useState(String(defaultValues?.yieldQuantity ?? ""))
  const [yieldUnitId, setYieldUnitId]     = useState(defaultValues?.yieldUnitId ?? "")
  const [notes, setNotes]                 = useState(defaultValues?.notes ?? "")
  const [items, setItems]                 = useState<IngredientRow[]>(defaultValues?.items ?? [{ ...EMPTY_ITEM }])

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof IngredientRow, value: string | number) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ))
  }

  // Auto-completar unidad al seleccionar materia prima
  function handleMPChange(idx: number, mpId: string) {
    const mp = rawMaterials.find(m => m.id === mpId)
    updateItem(idx, "rawMaterialId", mpId)
    if (mp?.unitId) updateItem(idx, "unitId", mp.unitId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some(i => !i.rawMaterialId || !i.quantity || !i.unitId)) {
      toast.error("Completá todos los campos de ingredientes")
      return
    }
    setLoading(true)
    try {
      const payload = { productId, name, yieldQuantity: Number(yieldQty), yieldUnitId, notes, items }
      if (mode === "create") {
        const recipe = await createRecipe(payload)
        toast.success("Receta creada")
        router.push(`/recipes/${recipe.id}`)
      } else {
        await updateRecipe(recipeId!, payload)
        toast.success("Receta actualizada")
        router.refresh()
        setOpen(false)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "edit" && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-500 hover:text-zinc-900 font-medium underline underline-offset-2"
      >
        Editar receta
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
        <h3 className="font-semibold text-zinc-800 text-sm">
          {mode === "create" ? "Nueva receta" : "Editar receta"}
        </h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Encabezado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Producto *</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Seleccionar...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre de la receta *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ej: Medialuna clásica"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Rendimiento *</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={yieldQty}
                onChange={e => setYieldQty(e.target.value)}
                required
                placeholder="48"
                className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <select
                value={yieldUnitId}
                onChange={e => setYieldUnitId(e.target.value)}
                required
                className="w-28 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Unidad</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Notas</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instrucciones especiales..."
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Ingredientes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-600">Ingredientes *</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={item.rawMaterialId}
                  onChange={e => handleMPChange(idx, e.target.value)}
                  required
                  className="flex-1 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Materia prima...</option>
                  {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={item.quantity || ""}
                  onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                  required
                  placeholder="Cant."
                  className="w-24 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />

                <select
                  value={item.unitId}
                  onChange={e => updateItem(idx, "unitId", e.target.value)}
                  required
                  className="w-24 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Um</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
                </select>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="p-2 text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          {mode === "edit" && (
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 px-4 py-2">
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium
                       hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : mode === "create" ? "Crear receta" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  )
}
