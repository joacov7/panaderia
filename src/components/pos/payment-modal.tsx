"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils/currency"
import { X, Banknote, CreditCard, Smartphone, BookUser } from "lucide-react"
import type { Client } from "@/db/schema"

type PaymentMethod = "cash" | "card" | "transfer" | "account"

interface Props {
  total:    number
  clients:  Client[]
  onConfirm: (method: PaymentMethod, clientId?: string) => Promise<void>
  onClose:  () => void
}

const METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash",     label: "Efectivo",       icon: Banknote },
  { value: "card",     label: "Tarjeta",         icon: CreditCard },
  { value: "transfer", label: "Transferencia",   icon: Smartphone },
  { value: "account",  label: "Cuenta corriente", icon: BookUser },
]

export function PaymentModal({ total, clients, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [clientId, setClientId] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (method === "account" && !clientId) return
    setLoading(true)
    await onConfirm(method, clientId || undefined)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="font-semibold text-zinc-900">Forma de pago</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-900">{formatCurrency(total)}</p>
            <p className="text-sm text-zinc-400 mt-1">Total a cobrar</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(m => {
              const Icon = m.icon
              return (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all
                    ${method === m.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {method === "account" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Cliente *
              </label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Seleccionar cliente...</option>
                {clients
                  .filter(c => Number(c.currentBalance) < Number(c.creditLimit))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Saldo: {formatCurrency(c.currentBalance)}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading || (method === "account" && !clientId)}
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold
                       hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Procesando..." : "Confirmar cobro"}
          </button>
        </div>
      </div>
    </div>
  )
}
