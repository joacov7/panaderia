"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRawMaterial } from "@/lib/actions/stock"
import { toast } from "sonner"
import type { Category, UnitOfMeasure } from "@/db/schema"

interface Props {
  categories: Category[]
  units:      UnitOfMeasure[]
}

export function NewRawMaterialForm({ categories, units }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [v, setV] = useState({
    name: "", sku: "", categoryId: "", unitId: "",
    stockCurrent: 0, stockMin: 0, costPerUnit: 0,
  })

  function set(field: string, value: string | number) {
    setV(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const item = await createRawMaterial({
        ...v,
        sku:        v.sku || undefined,
        categoryId: v.categoryId || undefined,
      })
      toast.success("Materia prima creada")
      router.push(`/stock/raw-materials/${item.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre *</label>
          <input value={v.name} onChange={e => set("name", e.target.value)} required
            placeholder="Ej: Harina 000"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">SKU / Código</label>
          <input value={v.sku} onChange={e => set("sku", e.target.value)}
            placeholder="MP-001"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Categoría</label>
          <select value={v.categoryId} onChange={e => set("categoryId", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
            <option value="">Sin categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Unidad de medida *</label>
          <select value={v.unitId} onChange={e => set("unitId", e.target.value)} required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
            <option value="">Seleccionar...</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Stock actual</label>
          <input type="number" min="0" step="0.001" value={v.stockCurrent}
            onChange={e => set("stockCurrent", Number(e.target.value))}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Stock mínimo</label>
          <input type="number" min="0" step="0.001" value={v.stockMin}
            onChange={e => set("stockMin", Number(e.target.value))}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Costo por unidad</label>
          <input type="number" min="0" step="0.01" value={v.costPerUnit}
            onChange={e => set("costPerUnit", Number(e.target.value))}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? "Creando..." : "Crear materia prima"}
        </button>
      </div>
    </form>
  )
}
