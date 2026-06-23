"use client"

import { useState } from "react"
import { updateTenantName } from "@/lib/actions/settings"
import { toast } from "sonner"

export function UpdateTenantForm({ name }: { name: string }) {
  const [value, setValue] = useState(name)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateTenantName({ name: value })
      toast.success("Nombre actualizado")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        required
        placeholder="Nombre de tu panadería"
        className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium
                   hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  )
}
