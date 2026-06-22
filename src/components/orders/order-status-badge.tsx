type OrderStatus = "pending" | "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled"

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:       "Pendiente",
  confirmed:     "Confirmado",
  in_production: "En producción",
  ready:         "Listo",
  dispatched:    "Despachado",
  delivered:     "Entregado",
  cancelled:     "Cancelado",
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:       "bg-yellow-100 text-yellow-700",
  confirmed:     "bg-blue-100 text-blue-700",
  in_production: "bg-purple-100 text-purple-700",
  ready:         "bg-green-100 text-green-700",
  dispatched:    "bg-indigo-100 text-indigo-700",
  delivered:     "bg-zinc-100 text-zinc-600",
  cancelled:     "bg-red-100 text-red-600",
}

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[s] ?? "bg-zinc-100 text-zinc-600"}`}>
      {STATUS_LABELS[s] ?? status}
    </span>
  )
}
