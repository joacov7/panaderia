"use client"

import { useState } from "react"
import { openCashSession } from "@/lib/actions/pos"
import { useRouter } from "next/navigation"
import type { CashRegister } from "@/db/schema"
import { Store } from "lucide-react"
import { toast } from "sonner"

interface Props {
  registers: CashRegister[]
}

export function OpenSessionForm({ registers }: Props) {
  const router = useRouter()
  const [registerId, setRegisterId]       = useState(registers[0]?.id ?? "")
  const [openingAmount, setOpeningAmount] = useState("0")
  const [loading, setLoading]             = useState(false)

  async function handleOpen() {
    if (!registerId) return
    setLoading(true)
    try {
      await openCashSession({ registerId, openingAmount: Number(openingAmount) })
      router.refresh()
      toast.success("Caja abierta")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al abrir caja")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 w-full max-w-sm shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-3">
            <Store className="w-6 h-6 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Abrir caja</h2>
          <p className="text-sm text-zinc-500 mt-1">Ingresá el efectivo inicial</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Caja</label>
            <select
              value={registerId}
              onChange={e => setRegisterId(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {registers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Efectivo inicial
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-zinc-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <button
            onClick={handleOpen}
            disabled={loading || !registerId}
            className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-medium text-sm
                       hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Abriendo..." : "Abrir caja"}
          </button>
        </div>
      </div>
    </div>
  )
}
