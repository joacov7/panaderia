"use client"

import { useState } from "react"
import { inviteUser } from "@/lib/actions/settings"
import { toast } from "sonner"
import { Plus } from "lucide-react"

const ROLES = [
  { value: "owner",      label: "Dueño" },
  { value: "supervisor", label: "Supervisor" },
  { value: "production", label: "Producción" },
  { value: "delivery",   label: "Reparto" },
  { value: "cashier",    label: "Caja" },
  { value: "seller",     label: "Vendedor" },
]

export function InviteUserForm() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName]       = useState("")
  const [email, setEmail]     = useState("")
  const [role, setRole]       = useState("seller")
  const [phone, setPhone]     = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await inviteUser({ name, email, role, phone: phone || undefined })
      toast.success(`Usuario creado. Contraseña temporal: ${result.tempPassword}`, { duration: 10000 })
      setName(""); setEmail(""); setRole("seller"); setPhone("")
      setOpen(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear usuario")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                   text-sm font-medium hover:bg-zinc-700 transition-colors w-fit"
      >
        <Plus className="w-4 h-4" /> Invitar usuario
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <h3 className="font-semibold text-zinc-800 text-sm">Nuevo usuario</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Juan García"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Email *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="juan@panaderia.com"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Rol *</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Teléfono</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+54 9 11..."
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 px-4 py-2">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium
                     hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  )
}
