"use client"

import { updateOrderStatus } from "@/lib/actions/orders"
import { toast } from "sonner"
import { useState } from "react"

type OrderStatus = "pending" | "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled"

const NEXT_STATUS: Partial<Record<OrderStatus, { value: OrderStatus; label: string }>> = {
  pending:       { value: "confirmed",     label: "Confirmar" },
  confirmed:     { value: "in_production", label: "Iniciar producción" },
  in_production: { value: "ready",         label: "Marcar listo" },
  ready:         { value: "dispatched",    label: "Despachar" },
  dispatched:    { value: "delivered",     label: "Entregar" },
}

export function OrderStatusActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const next = NEXT_STATUS[currentStatus as OrderStatus]

  if (!next) return null

  async function handleAdvance() {
    setLoading(true)
    try {
      await updateOrderStatus(orderId, next!.value as "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled")
      toast.success(`Estado actualizado a: ${next!.label}`)
    } catch {
      toast.error("Error al actualizar estado")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm("¿Cancelar este pedido?")) return
    setLoading(true)
    try {
      await updateOrderStatus(orderId, "cancelled")
      toast.success("Pedido cancelado")
    } catch {
      toast.error("Error al cancelar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleAdvance}
        disabled={loading}
        className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg font-medium
                   hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {next.label}
      </button>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}
