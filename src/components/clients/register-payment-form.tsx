"use client"

import { useState } from "react"
import { registerClientPayment } from "@/lib/actions/clients"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"
import { toast } from "sonner"

interface Props {
  clientId:       string
  currentBalance: number
}

export function RegisterPaymentForm({ clientId, currentBalance }: Props) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [amount, setAmount]       = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(amount)
    if (!num || num <= 0) return
    setLoading(true)
    try {
      await registerClientPayment({ clientId, amount: num, description })
      toast.success("Pago registrado")
      setOpen(false)
      setAmount("")
      setDescription("")
      router.refresh()
    } catch {
      toast.error("Error al registrar pago")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                   hover:bg-green-700 transition-colors"
      >
        Registrar pago
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
          <input
            type="number"
            min="0.01"
            max={currentBalance}
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="pl-7 pr-3 py-2 w-32 border border-zinc-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
            autoFocus
          />
        </div>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Nota (opcional)"
          className="px-3 py-2 w-40 border border-zinc-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium
                     hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-zinc-700 px-2 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-zinc-400">Saldo actual: {formatCurrency(currentBalance)}</p>
    </form>
  )
}
