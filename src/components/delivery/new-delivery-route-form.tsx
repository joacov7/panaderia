"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDeliveryRoute } from "@/lib/actions/delivery"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/currency"

interface Driver { id: string; name: string }
interface Order {
  id: string
  client?: { name: string; address?: string | null } | null
  totalAmount: string | number
  items: { id: string }[]
}

interface Props {
  drivers:     Driver[]
  orders:      Order[]
  defaultDate: string
}

export function NewDeliveryRouteForm({ drivers, orders, defaultDate }: Props) {
  const router = useRouter()
  const [loading, setLoading]         = useState(false)
  const [date, setDate]               = useState(defaultDate)
  const [assignedTo, setAssignedTo]   = useState(drivers[0]?.id ?? "")
  const [vehicleInfo, setVehicleInfo] = useState("")
  const [notes, setNotes]             = useState("")
  const [selected, setSelected]       = useState<Set<string>>(new Set())

  function toggleOrder(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) { toast.error("Seleccioná al menos un pedido"); return }
    if (!assignedTo) { toast.error("Seleccioná un repartidor"); return }
    setLoading(true)
    try {
      const route = await createDeliveryRoute({
        date,
        assignedTo,
        vehicleInfo: vehicleInfo || undefined,
        notes:       notes || undefined,
        orderIds:    [...selected],
      })
      toast.success("Ruta creada")
      router.push(`/delivery/${route.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear ruta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-800 text-sm">Datos de la ruta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Fecha *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Repartidor *</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
              <option value="">Seleccionar...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Vehículo</label>
            <input value={vehicleInfo} onChange={e => setVehicleInfo(e.target.value)}
              placeholder="Ej: Fiat Fiorino ABC-123"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Notas</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Indicaciones..."
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 text-sm">
            Pedidos para hoy
            {orders.length === 0 && <span className="text-zinc-400 font-normal ml-2">(sin pedidos confirmados/listos)</span>}
          </h3>
          {selected.size > 0 && (
            <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">
              {selected.size} seleccionados
            </span>
          )}
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">
            No hay pedidos de reparto confirmados o listos para hoy.
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <label key={order.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selected.has(order.id) ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                <input
                  type="checkbox"
                  checked={selected.has(order.id)}
                  onChange={() => toggleOrder(order.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800">
                    {order.client?.name ?? "Sin cliente"}
                  </p>
                  {order.client?.address && (
                    <p className="text-xs text-zinc-400">{order.client.address}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {order.items.length} producto{order.items.length !== 1 ? "s" : ""} · {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading || selected.size === 0}
          className="bg-zinc-900 text-white px-6 py-2 rounded-lg text-sm font-medium
                     hover:bg-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? "Creando..." : `Crear ruta con ${selected.size} pedido${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  )
}
