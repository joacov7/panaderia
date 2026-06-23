"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Category, UnitOfMeasure } from "@/db/schema"
import { db } from "@/db"

interface DefaultValues {
  name:        string
  sku:         string
  categoryId:  string
  unitId:      string
  stockMin:    number
  costPerUnit: number
}

interface Props {
  rawMaterialId: string
  defaultValues: DefaultValues
  categories:    Category[]
  units:         UnitOfMeasure[]
}

async function updateRawMaterialClient(id: string, data: DefaultValues) {
  const { updateRawMaterial } = await import("@/lib/actions/stock")
  return updateRawMaterial(id, data)
}

export function RawMaterialEditForm({ rawMaterialId, defaultValues, categories, units }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [v, setV]             = useState(defaultValues)

  function set(field: keyof DefaultValues, value: string | number) {
    setV(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateRawMaterialClient(rawMaterialId, v)
      toast.success("Materia prima actualizada")
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-sm text-zinc-500 hover:text-zinc-900 font-medium underline underline-offset-2">
        Editar datos
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <h3 className="font-semibold text-zinc-800 text-sm">Editar materia prima</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre *</label>
          <input value={v.name} onChange={e => set("name", e.target.value)} required
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
          <label className="block text-xs font-medium text-zinc-600 mb-1">Unidad *</label>
          <select value={v.unitId} onChange={e => set("unitId", e.target.value)} required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
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
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 px-4 py-2">Cancelar</button>
        <button type="submit" disabled={loading}
          className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}
