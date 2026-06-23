"use client"

import { useState } from "react"
import { updateProductionItemStatus } from "@/lib/actions/production"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Play, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Ingredient {
  name:     string
  quantity: number
  unit:     string
}

interface ProductionItem {
  id:               string
  status:           string
  quantityPlanned:  number
  quantityProduced: number | null
  wasteQuantity:    number | null
  productName:      string
  recipeName:       string
  ingredients:      Ingredient[]
}

export function ProductionItemCard({ item }: { item: ProductionItem }) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [produced, setProduced]   = useState(String(item.quantityPlanned))
  const [waste, setWaste]         = useState("0")

  const isDone       = item.status === "done"
  const isInProgress = item.status === "in_progress"

  async function startItem() {
    setLoading(true)
    try {
      await updateProductionItemStatus(item.id, "in_progress")
      toast.success("Producción iniciada")
      router.refresh()
    } catch {
      toast.error("Error al iniciar")
    } finally {
      setLoading(false)
    }
  }

  async function completeItem() {
    setLoading(true)
    try {
      await updateProductionItemStatus(item.id, "done", Number(produced), Number(waste))
      toast.success("Ítem completado. Stock actualizado.")
      router.refresh()
    } catch {
      toast.error("Error al completar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors
      ${isDone ? "border-green-200" : isInProgress ? "border-blue-200" : "border-zinc-200"}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-800">{item.productName}</p>
          <p className="text-xs text-zinc-400">{item.recipeName} · {item.quantityPlanned} u planificadas</p>
        </div>

        {isDone ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {item.quantityProduced} prod. / {item.wasteQuantity} merma
          </div>
        ) : isInProgress ? (
          <div className="flex items-center gap-2">
            <div>
              <label className="text-xs text-zinc-400">Producidas</label>
              <input
                type="number" min="0" step="1"
                value={produced}
                onChange={e => setProduced(e.target.value)}
                className="ml-2 w-20 border border-zinc-300 rounded-lg px-2 py-1 text-sm text-right
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Merma</label>
              <input
                type="number" min="0" step="1"
                value={waste}
                onChange={e => setWaste(e.target.value)}
                className="ml-2 w-16 border border-zinc-300 rounded-lg px-2 py-1 text-sm text-right
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <button
              onClick={completeItem}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium
                         hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Completar
            </button>
          </div>
        ) : (
          <button
            onClick={startItem}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg
                       text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3" /> Iniciar
          </button>
        )}

        {item.ingredients.length > 0 && (
          <button
            onClick={() => setOpen(prev => !prev)}
            className="text-zinc-400 hover:text-zinc-700 p-1"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {open && item.ingredients.length > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <p className="text-xs font-medium text-zinc-500 mb-2">Ingredientes necesarios</p>
          <div className="flex flex-wrap gap-2">
            {item.ingredients.map((ing, i) => (
              <span key={i} className="text-xs bg-white border border-zinc-200 text-zinc-600 px-2 py-1 rounded-full">
                {ing.quantity} {ing.unit} {ing.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
