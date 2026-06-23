"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, updateClient } from "@/lib/actions/clients"
import { toast } from "sonner"

interface DefaultValues {
  name:        string
  taxId:       string
  address:     string
  phone:       string
  email:       string
  type:        "retail" | "wholesale"
  creditLimit: number
  notes:       string
}

interface Props {
  mode:          "create" | "edit"
  clientId?:     string
  defaultValues?: DefaultValues
}

const empty: DefaultValues = {
  name: "", taxId: "", address: "", phone: "", email: "",
  type: "retail", creditLimit: 0, notes: "",
}

export function ClientForm({ mode, clientId, defaultValues }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(mode === "create")
  const [loading, setLoading] = useState(false)
  const [v, setV]             = useState<DefaultValues>(defaultValues ?? empty)

  function set(field: keyof DefaultValues, value: string | number) {
    setV(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...v, email: v.email || undefined, creditLimit: Number(v.creditLimit) }
      if (mode === "create") {
        const client = await createClient(payload)
        toast.success("Cliente creado")
        router.push(`/clients/${client.id}`)
      } else {
        await updateClient(clientId!, payload)
        toast.success("Cliente actualizado")
        router.refresh()
        setOpen(false)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "edit" && !open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-sm text-zinc-500 hover:text-zinc-900 font-medium underline underline-offset-2">
        Editar datos del cliente
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <h3 className="font-semibold text-zinc-800 text-sm">
        {mode === "create" ? "Datos del cliente" : "Editar cliente"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre *</label>
          <input value={v.name} onChange={e => set("name", e.target.value)} required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Tipo</label>
          <select value={v.type} onChange={e => set("type", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
            <option value="retail">Minorista</option>
            <option value="wholesale">Mayorista</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Teléfono</label>
          <input value={v.phone} onChange={e => set("phone", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Email</label>
          <input type="email" value={v.email} onChange={e => set("email", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">CUIT/DNI</label>
          <input value={v.taxId} onChange={e => set("taxId", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 mb-1">Dirección</label>
          <input value={v.address} onChange={e => set("address", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Límite de crédito</label>
          <input type="number" min="0" step="0.01" value={v.creditLimit}
            onChange={e => set("creditLimit", Number(e.target.value))}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Notas</label>
          <input value={v.notes} onChange={e => set("notes", e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        {mode === "edit" && (
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 px-4 py-2">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading}
          className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? "Guardando..." : mode === "create" ? "Crear cliente" : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}
