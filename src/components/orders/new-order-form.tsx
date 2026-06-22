"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrder } from "@/lib/actions/orders"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Client } from "@/db/schema"
import type { Product } from "@/db/schema"

interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantityOrdered: number
}

interface Props {
  clients:  Client[]
  products: Product[]
}

const today = new Date().toISOString().split("T")[0]

export function NewOrderForm({ clients, products }: Props) {
  const router = useRouter()
  const [loading, setLoading]         = useState(false)
  const [clientId, setClientId]       = useState("")
  const [deliveryDate, setDeliveryDate] = useState(today)
  const [type, setType]               = useState<"delivery" | "pos" | "wholesale">("delivery")
  const [notes, setNotes]             = useState("")
  const [items, setItems]             = useState<CartItem[]>([])

  function addItem() {
    setItems(prev => [...prev, { productId: "", productName: "", unitPrice: 0, quantityOrdered: 1 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleProductChange(idx: number, productId: string) {
    const product = products.find(p => p.id === productId)
    setItems(prev => prev.map((item, i) =>
      i === idx ? {
        ...item,
        productId,
        productName: product?.name ?? "",
        unitPrice: product ? (type === "wholesale" ? Number(product.wholesalePrice ?? product.salePrice) : Number(product.salePrice)) : 0,
      } : item
    ))
  }

  function updateItem(idx: number, field: keyof CartItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantityOrdered, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error("Agregá al menos un producto")
      return
    }
    if (items.some(i => !i.productId || !i.quantityOrdered || !i.unitPrice)) {
      toast.error("Completá todos los campos de los productos")
      return
    }
    setLoading(true)
    try {
      await createOrder({
        clientId: clientId || undefined,
        deliveryDate,
        type,
        notes: notes || undefined,
        items: items.map(i => ({
          productId:       i.productId,
          quantityOrdered: i.quantityOrdered,
          unitPrice:       i.unitPrice,
        })),
      })
      toast.success("Pedido creado")
      router.push("/orders")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear pedido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header fields */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-800 text-sm">Datos del pedido</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Cliente</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Sin cliente asignado</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Tipo de pedido *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as "delivery" | "pos" | "wholesale")}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="delivery">Reparto</option>
              <option value="pos">Mostrador</option>
              <option value="wholesale">Mayorista</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Fecha de entrega *</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
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
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 text-sm">Productos</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">
            No hay productos. Hacé clic en "Agregar" para empezar.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={item.productId}
                  onChange={e => handleProductChange(idx, e.target.value)}
                  required
                  className="flex-1 border border-zinc-300 rounded-lg px-2 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Producto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantityOrdered}
                  onChange={e => updateItem(idx, "quantityOrdered", Number(e.target.value))}
                  required
                  placeholder="Cant."
                  className="w-20 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => updateItem(idx, "unitPrice", Number(e.target.value))}
                  required
                  placeholder="Precio"
                  className="w-28 border border-zinc-300 rounded-lg px-2 py-2 text-sm text-right
                             focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

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
          type="submit"
          disabled={loading}
          className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium
                     hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear pedido"}
        </button>
      </div>
    </form>
  )
}
