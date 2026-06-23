"use client"

import { useState } from "react"
import { updateRouteStatus } from "@/lib/actions/delivery"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type RouteStatus = "pending" | "in_progress" | "completed" | "cancelled"

const NEXT: Partial<Record<RouteStatus, { value: RouteStatus; label: string }>> = {
  pending:     { value: "in_progress", label: "Iniciar ruta" },
  in_progress: { value: "completed",   label: "Completar" },
}

export function RouteStatusActions({ routeId, currentStatus }: { routeId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const next = NEXT[currentStatus as RouteStatus]

  if (!next) return null

  async function handleAdvance() {
    setLoading(true)
    try {
      await updateRouteStatus(routeId, next!.value)
      toast.success("Estado actualizado")
      router.refresh()
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleAdvance} disabled={loading}
      className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium
                 hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0">
      {loading ? "..." : next.label}
    </button>
  )
}
