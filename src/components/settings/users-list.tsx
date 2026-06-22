"use client"

import { useState } from "react"
import { updateUserRole, toggleUserActive } from "@/lib/actions/settings"
import { toast } from "sonner"

type UserRole = "admin" | "owner" | "supervisor" | "production" | "delivery" | "cashier" | "seller"

const ROLE_LABELS: Record<UserRole, string> = {
  admin:      "Admin",
  owner:      "Dueño",
  supervisor: "Supervisor",
  production: "Producción",
  delivery:   "Reparto",
  cashier:    "Caja",
  seller:     "Vendedor",
}

interface UserRow {
  id:       string
  name:     string
  email:    string
  role:     UserRole
  isActive: boolean
  phone:    string | null
}

export function UsersList({ users }: { users: UserRow[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleRoleChange(userId: string, role: UserRole) {
    setLoading(userId)
    try {
      await updateUserRole(userId, role)
      toast.success("Rol actualizado")
    } catch {
      toast.error("Error al actualizar rol")
    } finally {
      setLoading(null)
    }
  }

  async function handleToggle(userId: string, isActive: boolean) {
    setLoading(userId)
    try {
      await toggleUserActive(userId, isActive)
      toast.success(isActive ? "Usuario activado" : "Usuario desactivado")
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
        <h3 className="font-semibold text-zinc-800 text-sm">Miembros del equipo</h3>
      </div>
      <div className="divide-y divide-zinc-100">
        {users.map(user => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800">{user.name}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>

            <select
              defaultValue={user.role}
              onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
              disabled={loading === user.id}
              className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs
                         focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
            >
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            <button
              onClick={() => handleToggle(user.id, !user.isActive)}
              disabled={loading === user.id}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50
                ${user.isActive
                  ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                  : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700"
                }`}
            >
              {user.isActive ? "Activo" : "Inactivo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
