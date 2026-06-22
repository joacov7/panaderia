"use client"

import { useState } from "react"
import { useOfflineSync } from "@/lib/hooks/use-offline-sync"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"
import { Wifi, WifiOff, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type StopStatus = "delivered" | "partial" | "failed"
type PaymentMethod = "cash" | "card" | "transfer" | "account"

const STATUS_OPTIONS: { value: StopStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "delivered", label: "Entregado completo", icon: CheckCircle, color: "border-green-500 bg-green-50 text-green-700" },
  { value: "partial",   label: "Entrega parcial",    icon: AlertCircle, color: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "failed",    label: "No pudo entregarse", icon: XCircle,     color: "border-red-400 bg-red-50 text-red-600" },
]

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash",     label: "Efectivo" },
  { value: "card",     label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "account",  label: "Cuenta corriente" },
]

interface Props {
  stopId:     string
  routeId:    string
  orderTotal: number
}

export function DeliveryStopForm({ stopId, routeId, orderTotal }: Props) {
  const router = useRouter()
  const { isOnline, queueStop, syncing } = useOfflineSync()

  const [status, setStatus]             = useState<StopStatus>("delivered")
  const [collected, setCollected]       = useState(String(orderTotal.toFixed(2)))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [notes, setNotes]               = useState("")
  const [loading, setLoading]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await queueStop({
        stopId,
        routeId,
        status,
        collectedAmount: status === "failed" ? 0 : Number(collected),
        paymentMethod:   status === "failed" ? "cash" : paymentMethod,
        notes,
      })

      toast.success(
        isOnline ? "Entrega registrada y sincronizada" : "Guardado offline. Se sincronizará al recuperar señal."
      )
      router.push(`/driver/${routeId}`)
    } catch {
      toast.error("Error al guardar la entrega")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Indicador online/offline */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        ${isOnline ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
        {isOnline
          ? <><Wifi className="w-4 h-4" /> Con señal — se sincroniza al confirmar</>
          : <><WifiOff className="w-4 h-4" /> Sin señal — se guardará localmente</>
        }
      </div>

      {/* Estado de entrega */}
      <div>
        <p className="text-sm font-medium text-zinc-700 mb-2">Estado de la entrega</p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                  ${status === opt.value ? opt.color + " border-2" : "border-zinc-200 bg-white text-zinc-600"}`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="sr-only"
                />
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Cobro (solo si hay entrega) */}
      {status !== "failed" && (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Monto cobrado
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={collected}
                onChange={e => setCollected(e.target.value)}
                className="w-full pl-7 pr-3 py-3 border border-zinc-300 rounded-xl text-lg font-bold
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1">Total del pedido: {formatCurrency(orderTotal)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">Forma de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${paymentMethod === m.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Nota (opcional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="No estaba el cliente, dejé con vecino..."
          rows={2}
          className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || syncing}
        className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold text-base
                   hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Guardando..." : "Confirmar entrega"}
      </button>
    </form>
  )
}
